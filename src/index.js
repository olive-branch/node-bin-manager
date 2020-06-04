const os = require('os')
const { join } = require('path')
const logger = require('./logger')
const restore = require('./restore')

function main() {
  let log = logger()
  let debug = true

  let opts = {
    log,
    cwd: process.cwd(),
    out: join(process.cwd(), 'node_modules', '.bin'),
    ext: process.platform === 'win32' ? '.exe' : '',
    platform: `${process.platform}-${os.arch}`,
    force: true,
    key: undefined
  }

  restore(opts)
    .then((files) => {
      if (files.length > 0) {
        log('info', `Installed dependencies:\n${files.join('\n')}`)
      } else {
        log('info', 'No binary dependencies to install')
      }
    })
    .catch((e) => {
      log('error', debug ? e : e.message)
      process.exit(1)
    })
}

main()
