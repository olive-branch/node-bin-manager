import fs from 'fs'
import { promisify } from 'util'
import { join, basename, parse as parsePath } from 'path'
import { Readable } from 'stream'

import { parseEntry } from './config'
import { fetch } from './fetch'
import { decompress } from './decompress'
import { RestoreOptions } from './types'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const fileName = (filepath: string) => parsePath(filepath).name

const loadPackageJson = async ({ configPath }: RestoreOptions, dontThrow?: boolean) => {
  if (fs.existsSync(configPath)) {
    let content = await readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } else if (dontThrow) {
    return {}
  } else {
    throw new Error('Unable to locate package.json in your working directory')
  }
}

const updatePackageJson = async (opts: RestoreOptions, url: string, name: string) => {
  let packageJson = await loadPackageJson(opts, true)
  let { binDependencies } = packageJson
  let { platform, configPath } = opts

  let newPackageJson = {
    ...packageJson,
    binDependencies: {
      ...binDependencies,
      [name]: {
        ...binDependencies[name],
        [platform]: url,
      },
    },
  }

  await writeFile(configPath, JSON.stringify(newPackageJson, null, 2))
}

const toFilename = ({ out, ext }: RestoreOptions, name: string) => join(out, `${name}${ext}`)

const shouldInstall = (opts: RestoreOptions) => ([name, url]: [string, string]) => {
  let hasUrl = Boolean(url)
  let notExists = opts.force || !fs.existsSync(toFilename(opts, name))
  let keyMatch = !opts.key || opts.key === name

  return hasUrl && notExists && keyMatch
}

const loadFile = async ({ log }: RestoreOptions, url: string) => {
  log('info', url)

  let resp = await fetch(url)

  log('start', parseInt(resp.headers['content-length']!, 10))
  resp.on('data', x => log('tick', Buffer.from(x).length))
  resp.on('end', () => log('stop'))

  return resp
}

const writeToFile = async ({ log }: RestoreOptions, src: Readable, outfile: string): Promise<string> =>
  new Promise((res, rej) => {
    // default mode is 0o666 - read\write for everybody;
    // 0o766 - add rights to execute for current user
    let mode = 0o766

    let $ = src.pipe(fs.createWriteStream(outfile, { mode }))

    $.on('finish', () => {
      log('info', `Unpacked to ${outfile}\n`)
      res(outfile)
    })
    $.on('error', e => rej(new Error(`Unable to write to file: ${e.message}`)))
  })

const installUrl = async (opts: RestoreOptions, url: string, key?: string): Promise<string[]> => {
  let resp = await loadFile(opts, url)
  let files = await decompress(opts, resp, basename(url))

  let promises = files.map(({ content, filename }) =>
    writeToFile(opts, content, toFilename(opts, key || filename)))

  return Promise.all(promises)
}

const sequentialInstall = (opts: RestoreOptions) => async (
  prev: Promise<string[]>,
  [key, url]: [string, string],
): Promise<string[]> => {
  let prevFiles = await prev
  let currFiles = await installUrl(opts, url, key)

  return [...prevFiles, ...currFiles]
}

export const install = async (opts: RestoreOptions, url: string) => {
  let files = await installUrl(opts, url, opts.key)
  let key = files.length === 1 ? fileName(files[0]) : opts.key

  if (key) {
    await updatePackageJson(opts, url, key)
  } else {
    opts.log('warn', "Unable to infer binary name from url - package.json won't be updated")
  }

  return files
}

export const restore = async (opts: RestoreOptions) => {
  let { binDependencies } = await loadPackageJson(opts)
  if (!binDependencies) {
    opts.log('warn', "package.json doesn't have 'binDependencies' key")
    return []
  }

  return Object
    .entries(binDependencies)
    .map(parseEntry(opts))
    .filter(shouldInstall(opts))
    .reduce(sequentialInstall(opts), Promise.resolve([]))
}
