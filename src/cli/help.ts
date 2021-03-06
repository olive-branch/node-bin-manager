import { CommandArg, CommandConfig, CommandOption } from './shared'
import { Section, Paddings, joinSections } from '../internal/format'

const padding: Paddings = [0, 0, 0, 2]

const wrapArg = (x: CommandArg) => x.required ? `<${x.name}>` : `[${x.name}]`

const formatUsage = (config: CommandConfig, exe: string): Section => {
  let { name, desc } = config
  let args = config.args || []

  let usage = `${exe} ${name} ${args.map(wrapArg).join(' ')} [options]`

  return {
    padding,
    title: 'USAGE',
    lines: [[usage, desc || '']],
  }
}

const formatArgs = (xs: CommandArg[]): Section => ({
  padding,
  title: 'ARGS',
  lines: xs.map(x => [wrapArg(x), x.desc || '']),
})

const formatOptions = (xs: { [k: string]: CommandOption | undefined }): Section => ({
  padding,
  title: 'OPTIONS',
  lines: Object
    .entries(xs)
    .filter(([, v]) => Boolean(v))
    .map(([key, x]: [string, CommandOption]) => {
      let desc = x.desc || ''
      let alias = x.alias ? `-${x.alias} | ` : ''
      let value = x.value ? ` <${x.value}>` : ''
      let name = `${alias}--${key}${value}`

      return [name, desc]
    }),
})


export const formatCommandHelp = (config: CommandConfig, exe: string) => joinSections(
  formatUsage(config, exe),
  formatArgs(config.args || []),
  formatOptions(config.options || {}),
)

export const formatGeneralHelp = (name: string, desc: string, commands: CommandConfig[]) => {
  let usage = `${name} [OPTIONS] <COMMAND>`

  return joinSections(
    { title: 'USAGE', lines: [[usage, desc || '']] },
    { title: 'COMMANDS', lines: commands.map(x => [x.name, x.desc || '']) },
    { title: `Run '${name} COMMAND --help' for more information on a command.`, lines: ' ' },
  )
}
