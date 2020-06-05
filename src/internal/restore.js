const fs = require('fs')
const { promisify } = require('util')
const { join, basename } = require('path')

const parseEntry = require('./config')
const fetchFile = require('./fetch')
const decompress = require('./decompress')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

const loadPackageJson = async ({ package }, dontThrow) => {
  if (fs.existsSync(package)) {
    let content = await readFile(package, 'utf-8')
    return JSON.parse(content)
  } else if (dontThrow) {
    return {}
  } else {
    throw new Error('Unable to locate package.json in your working directory')
  }
}

const updatePackageJson = async (opts, url, name) => {
  let packageJson = await loadPackageJson(opts, true)
  let { binDependencies } = packageJson
  let { platform, package } = opts

  let newPackageJson = {
    ...packageJson,
    binDependencies: {
      ...binDependencies,
      [name]: { [platform]: url }
    }
  }

  await writeFile(package, JSON.stringify(newPackageJson, null, 2))
}

const toFilename = ({ out, ext }, name) => join(out, `${name}${ext}`)

const shouldInstall = (opts) => ([name, url]) => {
  let hasUrl = Boolean(url)
  let notExists = opts.force || !fs.existsSync(toFilename(opts, name))
  let keyMatch = !opts.key || opts.key === name

  return hasUrl && notExists && keyMatch
}

const loadFile = async ({ log }, url) => {
  log('info', url)

  let resp = await fetchFile(url)

  log('start', parseInt(resp.headers['content-length']))
  resp.on('data', x => log('tick', Buffer.from(x).length))
  resp.on('end', () => log('stop'))

  return resp
}

const writeToFile = async ({ log }, src, outfile) => new Promise((res, rej) => {
  // default mode is 0o666 - read\write for everybody;
  // 0o766 - add rights to execute for current user
  let mode = 0o766

  let $ = src.pipe(fs.createWriteStream(outfile, { mode }))

  $.on('finish', () => {
    log('info', `Unpacked to ${outfile}\n`)
    res()
  })
  $.on('error', e => rej(new Error(`Unable to write to file: ${e.message}`)))
})

const install = async (opts, url, key) => {
  let resp = await loadFile(opts, url)
  let { content, filename } = await decompress(opts, resp, basename(url))

  let outfile = toFilename(opts, key || filename)
  await writeToFile(opts, content, outfile)

  if (!key) {
    await updatePackageJson(opts, url, filename)
  }

  return [outfile]
}

const sequentialInstall = (opts) => async (prev, [key, url]) => {
  let prevFiles = await prev
  let currFiles = await install(opts, url, key)

  return [...prevFiles, ...currFiles]
}

const restore = async (opts) => {
  let { out, log } = opts

  await mkdir(out, { recursive: true })

  let { binDependencies } = await loadPackageJson(opts)
  if (!binDependencies) {
    log('warn', `package.json doesn't have 'binDependencies' key`)
    return []
  }

  return await Object
    .entries(binDependencies)
    .map(parseEntry(opts))
    .filter(shouldInstall(opts))
    .reduce(sequentialInstall(opts), [])
}

module.exports = { install, restore }
