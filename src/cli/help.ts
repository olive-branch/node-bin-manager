import { CommandArg, CommandConfig, CommandOption } from './shared'

type Section = {
  title: string,
  lines?: string | Array<undefined | string | string[]>,
}

const formatSection = (section: Section): string[] => {
  let pad = ' '.repeat(2)

  if (!section.lines || section.lines.length === 0) {
    return []
  }

  if (typeof section.lines === 'string') {
    return [section.title, section.lines]
  }

  let lines = section.lines.map((xs) => {
    if (Array.isArray(xs)) {
      let padding = 40
      let [a, b] = xs
      let line = `${a.padEnd(padding)}${b}`
      return `${pad}${line}`
    } else {
      return `${pad}${xs}`
    }
  })

  return [
    section.title,
    ...lines,
  ]
}

const joinSections = (...xs: Section[]) => xs
  .map(formatSection)
  .filter(x => x.length > 0)
  .map(x => `${x.join('\n')}`)
  .join('\n\n')

const wrapArg = (x: CommandArg) => x.required ? `<${x.name}>` : `[${x.name}]`

const formatUsage = (config: CommandConfig, exe: string): Section => {
  let { name, desc } = config
  let args = config.args || []

  let usage = `${exe} ${name} ${args.map(wrapArg).join(' ')} [options]`

  return {
    title: 'USAGE',
    lines: [[usage, desc || '']],
  }
}

const formatArgs = (xs: CommandArg[]): Section => ({
  title: 'ARGS',
  lines: xs.map(x => [wrapArg(x), x.desc || '']),
})

const formatOptions = (xs: { [k: string]: CommandOption | undefined }): Section => ({
  title: 'OPTIONS',
  lines: Object
    .entries(xs)
    .filter(([, v]) => Boolean(v))
    .map(([key, x]: [string, CommandOption]) => {
      let desc = x.desc || ''
      let alias = x.alias ? `-${x.alias}` : '  '
      let value = x.value ? ` <${x.value}>` : ''
      let name = `${alias} | --${key}${value}`

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
