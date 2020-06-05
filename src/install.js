const { join, resolve } = require('path')
const logger = require('./internal/logger')
const { restore, install } = require('./internal/restore')
const parseArgv = require('yargs-parser')

const alias = {
  out: ['o'],
  platform: ['p'],
  force: ['f'],
  key: ['k'],
  quiet: ['q'],
  cwd: ['c'],
}

const toOptions = (args) => {
  let log = args.quiet ? (() => true) : logger()
  let debug = args.debug || false
  let force = args.force || false

  let cwd = args.cwd || process.cwd()
  let out = args.out ? resolve(args.out) : join(cwd, 'node_modules', '.bin')
  let key = args.key || undefined

  let platform = args.platform || process.platform
  let ext = platform === 'win32' ? '.exe' : ''

  return { log, platform, cwd, out, ext, force, key, debug }
}

module.exports = async (argv, next) => {
  let args = parseArgv(argv.slice(2), { alias })
  let [cmd, url] = args._

  if (cmd !== 'install') {
    return await next(argv)
  }

  let opts = toOptions(args)
  let files = url
    ? await install(opts, url)
    : await restore(opts)

  if (files.length > 0) {
    opts.log('info', `Installed dependencies:\n${files.join('\n')}`)
  } else {
    opts.log('info', 'No binary dependencies to install')
  }
}
