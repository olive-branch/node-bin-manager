import { createApp } from './app'
import { installCommand } from './commands/install'

const run = createApp(
  'bindeps',
  installCommand(),
)

run(process.argv)
  .then((code) => {
    process.exit(code)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
