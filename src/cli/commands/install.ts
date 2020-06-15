import { join, resolve } from 'path'
import parseArgv from 'yargs-parser'
import { makeRe } from 'minimatch'
import { createLogger } from '../../internal/logger'
import { restore, install, RestoreOptions } from '../../lib/restore'
import { CommandHandler, CommandConfig, toArgsAliases, Command } from '../shared'
import { Platform } from '../../internal/config'

export type CommandArgs = {
  quiet?: boolean,
  raw?: boolean,
  debug?: boolean,
  force?: boolean,
  seq?: boolean,
  cwd?: string,
  out?: string,
  config?: string,
  key?: string,
  platform?: string,
}

const config: CommandConfig<CommandArgs> = {
  name: 'install',
  desc: 'Download binaries from specified URL or package.json',
  options: {
    quiet: {
      alias: ['q'],
      desc: 'Suppress all log messages',
    },
    raw: {
      desc: 'Output logs without spinners and colors',
    },
    debug: {
      desc: 'Display additional error information',
    },
    force: {
      alias: ['f'],
      desc: 'Download binaries event if they already installed',
    },
    cwd: {
      alias: ['c'],
      value: 'path',
      desc: 'Path to working directory with package.json and node_modules',
    },
    config: {
      value: 'path',
      desc: 'Path to configuration file; default is package.json in working directory'
    },
    out: {
      alias: ['o'],
      value: 'path',
      desc: 'Path to save all binaries; `./node_modules/.bin` is used by default',
    },
    key: {
      alias: ['k'],
      value: 'string',
      desc: 'Name of the dependecy install (from package.json)',
    },
    platform: {
      alias: ['p'],
      value: 'string',
      desc: 'Identifier of the platform to select the binary for',
    },
    seq: {
      alias: ['s'],
      desc: 'Install next binary only when previous completes (in package.json order)',
    },
  },
  args: [{
    name: 'url',
    desc: 'If provided, command will download this binary and update package.json',
  }],
}

const alias = toArgsAliases(config)

const toOptions = (args: CommandArgs): RestoreOptions => {
  let cwd = args.cwd || process.cwd()
  let platform: Platform = args.platform || process.platform as any

  return {
    cwd,
    platform,
    exclude: [makeRe('**/+(LICENSE|*.md)')],
    log: createLogger(args),
    outRaw: args.out,
    out: args.out ? resolve(cwd, args.out) : join(cwd, 'node_modules', '.bin'),
    configPath: args.config ? resolve(cwd, args.config) : join(cwd, 'package.json'),
    ext: platform === 'win32' ? '.exe' : '',
    force: args.force || false,
    key: args.key,
    debug: args.debug || false,
    concurrent: !args.seq,
  }
}

const handler: CommandHandler = async (argv, next) => {
  let args = parseArgv(argv.slice(2), { alias })
  let [cmd, url] = args._

  if (cmd !== 'install' && cmd !== 'i') {
    return next(argv)
  }

  let opts = toOptions(args as any)
  let promise = url ? install(opts, url) : restore(opts)

  return promise
    .then(() => 0)
    .catch((e) => {
      opts.log('panic', e)
      return 1
    })
}

export const installCommand = (): Command => ({ config, handler })
