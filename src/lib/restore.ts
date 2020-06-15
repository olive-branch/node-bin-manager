import fs from 'fs'
import { promisify } from 'util'
import { join, basename, parse as parsePath } from 'path'
import { Readable } from 'stream'

import { fromEntries, loadConfig, updateConfig } from '../internal/config'
import { fetch } from '../internal/fetch'
import { decompress, DecompressOption, DecompressMeta } from '../internal/decompress'

import { flatten } from '../internal/util'
import { concurrent, sequential } from '../internal/util/promise'
import { CreateLoggerOptions } from '../internal/logger'

import { BaseOptions } from './types'

const mkdir = promisify(fs.mkdir)

const fileName = (filepath: string) => parsePath(filepath).name

const toFilename = ({ out, ext }: BaseOptions, name: string) => join(out, `${name}${ext}`)

const shouldInstall = (opts: RestoreOptions) => (ctx: InstallContext) => {
  let { url, key } = ctx
  let hasUrl = Boolean(url)
  let notExists = !key || (opts.force || !fs.existsSync(toFilename(ctx, key)))
  let keyMatch = !opts.key || opts.key === key

  return hasUrl && notExists && keyMatch
}

const saveFile = async (src: Readable, outfile: string): Promise<string> =>
  new Promise((res, rej) => {
    // default mode is 0o666 - read\write for everybody;
    // 0o766 - add rights to execute for current user
    let mode = 0o766

    let $ = src.pipe(fs.createWriteStream(outfile, { mode }))

    $.on('finish', () => res(outfile))
    $.on('error', e => rej(new Error(`Unable to write to file: ${e.message}`)))
  })

const installUrl = async (opts: InstallContext): Promise<string[]> => {
  let resp = await fetch(opts, opts.url)

  let meta: DecompressMeta = {
    mime: resp.headers['content-type'],
    filename: basename(opts.url),
  }

  await mkdir(opts.out, { recursive: true })

  return decompress(opts, resp, meta, (content, filepath) => {
    if (!opts.key && !filepath) {
      return Promise.reject(new Error('Unable to infer binary filename from archive'))
    }

    let name = toFilename(opts, opts.key || fileName(filepath))

    return saveFile(content, name)
  })
}


export type RestoreOptions =
  & DecompressOption
  & CreateLoggerOptions
  & BaseOptions
  & {
    concurrent: boolean,
    force: boolean,
    key: string | undefined,
  }

type InstallContext =
  & RestoreOptions
  & { url: string }

export const install = async (opts: RestoreOptions, url: string) => {
  logStartup(opts, [url])
  let files = await installUrl({ ...opts, url })
  logComplete(opts, files)

  let key = files.length === 1 ? fileName(files[0]) : opts.key
  let out = opts.outRaw

  if (key) {
    opts.log('start', 'Updating package.json')
    await updateConfig(opts.configPath, key, { out, [opts.platform]: url })
    opts.log('stop', 'Updated package.json')
  } else {
    opts.log('warn', "Unable to infer binary name from url - package.json won't be updated")
  }

  return files
}

export const restore = async (opts: RestoreOptions) => {
  let { binDependencies } = await loadConfig(opts.configPath)
  if (!binDependencies) {
    opts.log('warn', "package.json doesn't have 'binDependencies' key")
    return []
  }

  let ctx = Object
    .entries(binDependencies)
    .map(fromEntries(opts))
    .map(x => ({ ...opts, ...x }) as InstallContext)
    .filter(shouldInstall(opts))

  logStartup(opts, ctx.map(({ url }) => url))

  let onReject = (e: Error): string[] => {
    opts.log('error', e)
    return []
  }

  let tasks = ctx.map(x => () => installUrl(x))
  let results = opts.concurrent ? concurrent(tasks, onReject) : sequential(tasks, onReject)
  let files = await results.then(flatten)

  logComplete(opts, files)

  return files
}


function logStartup(opts: BaseOptions, urls: string[]) {
  let { log, platform, configPath } = opts

  if (urls.length === 0) {
    log('stop', 'Nothing to install')
    return
  }

  let packages = urls.map(x => `    - ${x}`).join('\n')
  let startMsg = `Restoring binDependencies from '${configPath}' for '${platform}'

The following binaries will be downloaded:
${packages}
`

  log('info', startMsg)
  log('start')
}

function logComplete(opts: BaseOptions, files: string[]) {
  let { log } = opts
  let bins = files.map(x => `    - ${x}`).join('\n')

  if (bins.length === 0) {
    log('stop')
  } else {
    log('stop', `Installed binaries:\n${bins}`)
  }
}
