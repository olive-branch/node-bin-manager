const os = require('os')
const fs = require('fs')
const { join, basename } = require('path')
const { promisify } = require('util')

const fetchFile = require('./fetch')
const decompress = require('./decompress')
const logger = require('./logger')

const mkdir = promisify(fs.mkdir)

const loadPackageJson = (cwd) => {
  let filepath = join(cwd, 'package.json')

  if (fs.existsSync(filepath)) {
    return require(filepath)
  } else {
    throw new Error('Unable to locate package.json in your working directory')
  }
}

const toUrl = (platform) => ([key, value]) => {
  if (typeof value === 'string') {
    return [key, value]
  }
  if (typeof value === 'object') {
    return [key, value[platform]]
  }

  throw new TypeError(`Invalid binDependency format for ${key}. Value should be either string or object`)
}

const toFilename = (key, { out, ext }) => join(out, `${key}${ext}`)

const shouldInstall = (opts) => ([key, url]) => {
  let hasUrl = Boolean(url)
  let notExists = opts.force || !fs.existsSync(toFilename(key, opts))
  let keyMatch = !opts.key || opts.key === key

  return hasUrl && notExists && keyMatch
}

const loadFile = async (url, { log }) => {
  log('load', url)

  let resp = await fetchFile(url)

  log('start', parseInt(resp.headers['content-length']))
  resp.on('data', x => log('tick', Buffer.from(x).length))

  return resp
}

const writeToFile = async (src, outfile, { log }) => new Promise((res, rej) => {
  let $ = src.pipe(fs.createWriteStream(outfile))

  $.on('finish', () => {
    log('pack', `Unpacked to ${outfile}\n`)
    res()
  })
  $.on('error', e => rej(new Error(`Unable to write to file: ${e.message}`)))
})

const install = (opts) => async (prev, [key, url]) => {
  let prevFiles = await prev
  let resp = await loadFile(url, opts)
  let { content } = await decompress(resp, basename(url), opts)

  let outfile = toFilename(key, opts)
  await writeToFile(content, outfile, opts)

  return [...prevFiles, outfile]
}

async function main() {
  let platform = `${os.platform()}-${os.arch}`
  let cwd = process.cwd()
  let out = join(cwd, 'node_modules', '.bin')
  let ext = os.platform() === 'win32' ? '.exe' : ''
  let log = logger()
  let force = true
  let key = undefined

  let opts = { out, ext, platform, log, force, key }

  await mkdir(out, { recursive: true })

  let { binDependencies } = loadPackageJson(cwd)
  if (!binDependencies) {
    log('main', 'No binDependencies in package.json')
    return
  }

  return await Object
    .entries(binDependencies)
    .map(toUrl(platform))
    .filter(shouldInstall(opts))
    .reduce(install(opts), [])
}

main()
.then((xs) => {
  if (xs.length > 0) {
    console.log(`Installed dependencies:\n${xs.join('\n')}`)
  } else {
    console.log('No binary dependencies to install')
  }
})
.catch((e) => {
  console.error(e)
  process.exit(1)
})
