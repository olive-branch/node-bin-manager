import fs from 'fs'
import { promisify } from 'util'
import { join, resolve } from 'path'
import parseArgv from 'yargs-parser'
import { createLogger } from '../internal/util/logger'
import { restore, install } from '../lib/restore'
import { RestoreOptions } from '../internal/types'
import { CliCommand } from './shared'

const mkdir = promisify(fs.mkdir)

const alias = {
  out: ['o'],
  platform: ['p'],
  force: ['f'],
  key: ['k'],
  quiet: ['q'],
  cwd: ['c'],
}

const toOptions = (args: any): RestoreOptions => {
  let log = args.quiet ? (() => true) : createLogger()
  let debug = args.debug || false
  let force = args.force || false

  let cwd = args.cwd || process.cwd()
  let out = args.out ? resolve(cwd, args.out) : join(cwd, 'node_modules', '.bin')
  let configPath = join(cwd, 'package.json')
  let key = args.key || undefined

  let platform = args.platform || process.platform
  let ext = platform === 'win32' ? '.exe' : ''

  return { log, platform, cwd, out, configPath, ext, force, key, debug }
}

export const installCommand = (): CliCommand => async (argv, next) => {
  let args = parseArgv(argv.slice(2), { alias })
  let [cmd, url] = args._

  if (cmd !== 'install') {
    return next(argv)
  }

  let opts = toOptions(args)

  await mkdir(opts.out, { recursive: true })

  let files = url
    ? await install(opts, url)
    : await restore(opts)

  if (files.length > 0) {
    opts.log('info', `Installed dependencies:\n${files.join('\n')}`)
  } else {
    opts.log('info', 'No binary dependencies to install')
  }

  return 0
}
