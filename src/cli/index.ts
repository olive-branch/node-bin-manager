import { createLogger } from '../internal/util/logger'
import { middleware } from '../internal/util/middleware'
import { installCommand } from './install'
import { CliCommand } from './shared'

const showHelp = (): CliCommand => () => {
  console.log('HELP')

  return Promise.resolve(0)
}

const catchErrors = (): CliCommand => {
  let log = createLogger()

  return (ctx, next) => next(ctx).catch((e: any) => {
    log('error', e)
    return 1
  })
}

let run = middleware(
  catchErrors(),
  installCommand(),
  showHelp(),
)

function main() {
  run(process.argv)
    .then((code) => {
      process.exit(code)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

main()
