import fs from 'fs'
import { promisify } from 'util'
import { join, resolve } from 'path'
import parseArgv from 'yargs-parser'
import { createLogger } from '../internal/logger'
import { restore, install, RestoreOptions } from '../lib/restore'
import { CliCommand } from './shared'

const mkdir = promisify(fs.mkdir)

const alias = {
  quiet: ['q'],
  raw: [],
  debug: [],
  force: ['f'],
  cwd: ['c'],
  out: ['o'],
  key: ['k'],
  platform: ['p'],
  seq: ['s'],
}

type Args = { [K in keyof typeof alias]: any }

const toOptions = (args: Args): RestoreOptions => {
  let cwd = args.cwd || process.cwd()
  let platform = args.platform || process.platform

  return {
    cwd,
    platform,
    log: createLogger(args),
    out: args.out ? resolve(cwd, args.out) : join(cwd, 'node_modules', '.bin'),
    configPath: join(cwd, 'package.json'),
    ext: platform === 'win32' ? '.exe' : '',
    force: args.force || false,
    key: args.key,
    debug: args.debug || false,
    concurrent: !args.seq,
  }
}

export const installCommand = (): CliCommand => async (argv, next) => {
  let args = parseArgv(argv.slice(2), { alias })
  let [cmd, url] = args._

  if (cmd !== 'install') {
    return next(argv)
  }

  let opts = toOptions(args as any)

  await mkdir(opts.out, { recursive: true })

  let promise = url ? install(opts, url) : restore(opts)

  return promise
    .then(() => 0)
    .catch((e) => {
      opts.log('panic', e)
      return 1
    })
}
