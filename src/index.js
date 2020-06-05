const logger = require('./internal/logger')
const middleware = require('./internal/middleware')
const installCommand = require('./install')

const showHelp = () => {
  console.log('HELP')

  return Promise.resolve()
}

const catchErrors = (ctx, next) => {
  let log = logger()

  return next(ctx).catch(e => log('error', e))
}

let run = middleware(
  catchErrors,
  installCommand,
  showHelp,
)

function main() {
  run(process.argv).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

main()
