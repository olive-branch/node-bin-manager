import parseArgs from 'yargs-parser'
import { basename } from 'path'
import { middleware } from '../internal/util/middleware'
import { createLogger } from '../internal/logger'
import { CommandHandler, CommandConfig, Command } from './shared'
import { formatGeneralHelp, formatCommandHelp } from './help'

const generalHelp = (exe: string, cfg: CommandConfig[], code: number = 0) => {
  let text = formatGeneralHelp(exe, 'Binary Dependency Manager', cfg)
  console.log(text)

  return Promise.resolve(code)
}

const commandHelp = (exe: string, cfg: CommandConfig[], cmd: string) => {
  let config = cfg.find(x => x.name === cmd)

  if (!config) {
    console.error(`Unknown command '${cmd}'\n`)
    return generalHelp(exe, cfg, 1)
  }

  let text = formatCommandHelp(config, exe)
  console.log(text)

  return Promise.resolve(0)
}

const showHelp = (exe: string, cfg: CommandConfig[]): CommandHandler => (args, next) => {
  let { _: commands, h, help } = parseArgs(args.slice(2))
  let [cmd] = commands

  if (!cmd) {
    return generalHelp(exe, cfg)
  }

  if (h || help) {
    return commandHelp(exe, cfg, cmd)
  }

  return next(args)
}

const catchErrors = (): CommandHandler => {
  let log = createLogger()

  return (ctx, next) => next(ctx).catch((e: any) => {
    log('error', e)
    return 1
  })
}

const fallback = (exe: string, cfg: CommandConfig[]): CommandHandler => () => {
  console.error('Unknown command\n')

  return generalHelp(exe, cfg, 1)
}

export const createApp = (...cmds: Command[]) => {
  let name = basename(process.argv[1])
  let configs = cmds.map(x => x.config)
  let handlers = cmds.map(x => x.handler)

  return middleware(
    showHelp(name, configs),
    catchErrors(),
    ...handlers,
    fallback(name, configs),
  )
}
