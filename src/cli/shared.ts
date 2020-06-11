import { Middleware } from '../internal/util/middleware'

export type CommandHandler = Middleware<string[], Promise<number>>

export type CommandArg = {
  required?: boolean,
  name?: string,
  desc?: string,
}

export type CommandOption = {
  value?: string,
  alias?: string[],
  desc?: string,
}

export type CommandConfig<T = any> = {
  name: string,
  desc?: string,
  options?: { [K in keyof T]?: CommandOption },
  args?: Array<CommandArg>,
}

export type Command = {
  handler: CommandHandler,
  config: CommandConfig,
}

export const toArgsAliases = (config: CommandConfig) => {
  if (!config.options) {
    return {}
  }

  return Object
    .entries(config.options)
    .filter(([, v]) => Boolean(v))
    .reduce(
      (acc, [k, v]) => ({ ...acc, [k]: v!.alias || [] }),
      {},
    )
}
