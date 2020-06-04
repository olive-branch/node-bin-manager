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

const toFilename = (dir, key, platform) => {
  let ext = platform.startsWith('win32') ? '.exe' : ''

  return join(dir, `${key}${ext}`)
}

const notInstalled = (out, platform) => ([key, url]) => {
  if (!url) {
    return false
  }

  let filename = toFilename(out, key, platform)
  return !fs.existsSync(filename)
}

const loadFile = async (url, log) => {
  log('load', url)

  let resp = await fetchFile(url)

  log('start', parseInt(resp.headers['content-length']))
  resp.on('data', x => log('tick', Buffer.from(x).length))

  return resp
}

const writeToFile = async (outfile, src, log) => new Promise((res, rej) => {
  let $ = src.pipe(fs.createWriteStream(outfile))

  $.on('finish', () => {
    log('pack', `Unpacked to ${outfile}\n`)
    res()
  })
  $.on('error', e => rej(new Error(`Unable to write to file: ${e.message}`)))
})

const install = (platform, out, log) => async (prev, [key, url]) => {
  let prevFiles = await prev
  let resp = await loadFile(url, log)
  let [/* filename */, stream] = await decompress(basename(url), platform, resp)

  let outfile = toFilename(out, key, platform)
  await writeToFile(outfile, stream, log)

  return [...prevFiles, outfile]
}

async function main() {
  let cwd = process.cwd()
  let platform = `${os.platform()}-${os.arch}`
  let log = logger()

  let out = join(cwd, 'node_modules', '.bin')
  await mkdir(out, { recursive: true })

  let { binDependencies } = loadPackageJson(cwd)
  if (!binDependencies) {
    log('main', 'No binDependencies in package.json')
    return
  }

  return await Object
    .entries(binDependencies)
    .map(toUrl(platform))
    .filter(notInstalled(out, platform))
    .reduce(install(platform, out, log), [])
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
