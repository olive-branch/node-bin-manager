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

export function toArgsAliases<T = any>(config: CommandConfig<T>): { [key: string]: string[] } {
  if (!config.options) {
    return {}
  }

  return Object
    .entries(config.options)
    .filter(([, v]) => Boolean(v))
    .reduce(
      (acc, [k, v]: [string, any]) => ({
        ...acc,
        [k]: v!.alias || [],
      }),
      {},
    )
}
