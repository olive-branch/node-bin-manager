const fs = require('fs')
const { promisify } = require('util')
const { join, basename } = require('path')

const parseEntry = require('./internal/config')
const fetchFile = require('./internal/fetch')
const decompress = require('./internal/decompress')

const mkdir = promisify(fs.mkdir)

const loadPackageJson = (cwd) => {
  let filepath = join(cwd, 'package.json')

  if (fs.existsSync(filepath)) {
    return require(filepath)
  } else {
    throw new Error('Unable to locate package.json in your working directory')
  }
}

const toFilename = (key, { out, ext }) => join(out, `${key}${ext}`)

const shouldInstall = (opts) => ([key, url]) => {
  let hasUrl = Boolean(url)
  let notExists = opts.force || !fs.existsSync(toFilename(key, opts))
  let keyMatch = !opts.key || opts.key === key

  return hasUrl && notExists && keyMatch
}

const loadFile = async (url, { log }) => {
  log('info', url)

  let resp = await fetchFile(url)

  log('start', parseInt(resp.headers['content-length']))
  resp.on('data', x => log('tick', Buffer.from(x).length))
  resp.on('end', () => log('stop'))

  return resp
}

const writeToFile = async (src, outfile, { log }) => new Promise((res, rej) => {
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

const install = (opts) => async (prev, [key, url]) => {
  let prevFiles = await prev
  let resp = await loadFile(url, opts)
  let { content } = await decompress(resp, basename(url), opts)

  let outfile = toFilename(key, opts)
  await writeToFile(content, outfile, opts)

  return [...prevFiles, outfile]
}

module.exports = async (opts) => {
  let { out, cwd, log } = opts

  await mkdir(out, { recursive: true })

  let { binDependencies } = loadPackageJson(cwd)
  if (!binDependencies) {
    log('warn', `package.json doesn't have 'binDependencies' key`)
    return []
  }

  return await Object
    .entries(binDependencies)
    .map(parseEntry(opts))
    .filter(shouldInstall(opts))
    .reduce(install(opts), [])
}
