import fs from 'fs'
import { join, basename, parse as parsePath } from 'path'
import { Readable } from 'stream'

import { parseEntry, loadConfig, updateConfig } from '../internal/config'
import { fetch } from '../internal/fetch'
import { decompress } from '../internal/decompress'
import { RestoreOptions } from '../internal/types'
import { flatten } from '../internal/util'
import { concurrent, sequential } from '../internal/util/promise'


const fileName = (filepath: string) => parsePath(filepath).name

const toFilename = ({ out, ext }: RestoreOptions, name: string) => join(out, `${name}${ext}`)

const shouldInstall = (opts: RestoreOptions) => ([name, url]: [string, string]) => {
  let hasUrl = Boolean(url)
  let notExists = opts.force || !fs.existsSync(toFilename(opts, name))
  let keyMatch = !opts.key || opts.key === name

  return hasUrl && notExists && keyMatch
}

const fetchFile = async ({ log }: RestoreOptions, url: string) => {
  log('info', url)

  let resp = await fetch(url)

  log('start', parseInt(resp.headers['content-length']!, 10))
  resp.on('data', x => log('tick', Buffer.from(x).length))
  resp.on('end', () => log('stop'))

  return resp
}

const saveFile = async ({ log }: RestoreOptions, src: Readable, outfile: string): Promise<string> =>
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
  let resp = await fetchFile(opts, url)

  return decompress(opts, resp, basename(url), (content, filepath) => {
    let name = toFilename(opts, key || fileName(filepath))
    return saveFile(opts, content, name)
  })
}


export const install = async (opts: RestoreOptions, url: string) => {
  let files = await installUrl(opts, url, opts.key)
  let key = files.length === 1 ? fileName(files[0]) : opts.key

  if (key) {
    await updateConfig(opts.configPath, key, { [opts.platform]: url })
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

  let tasks = Object
    .entries(binDependencies)
    .map(parseEntry(opts))
    .filter(shouldInstall(opts))
    .map(([key, url]) => () => installUrl(opts, url!, key))

  let results = opts.concurrent ? concurrent(tasks) : sequential(tasks)

  return results.then(flatten)
}
