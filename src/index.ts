import { createLogger } from './internal/logger'
import { middleware, Middleware } from './internal/middleware'
import { installCommand } from './install'

const showHelp = <T>(): Middleware<T, Promise<number>> => () => {
  console.log('HELP')

  return Promise.resolve(0)
}

const catchErrors = <T>(): Middleware<T, Promise<number>> => {
  let log = createLogger()

  return (ctx, next) => next(ctx).catch((e: any) => {
    log('error', e)
    return 1
  })
}

let run = middleware(
  catchErrors(),
  installCommand,
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
