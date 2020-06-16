export type Section = {
  title: string,
  lines?: string | Array<undefined | string | string[]>,
  padding?: Paddings,
}

export type Paddings = [number, number, number, number]

type Column = {
  text: string,
  width?: number
  align?: 'right' | 'center',
  padding?: Paddings,
  border?: boolean,
}

type CLIUI = (opts?: { width?: number, wrap?: boolean }) => {
  div(...cols: Array<string | Column>): void,
  span(...cols: Array<string | Column>): void,
  resetOutput(): void,
  toString(): string,
}

const cliui: CLIUI = require('cliui')

const formatSection = (section: Section): string => {
  let { title, lines, padding } = section

  if (!lines) return ''

  let width = process.stdout.columns > 120 ? 120 : undefined

  let ui = cliui({ wrap: true, width })

  ui.div({ text: title })

  if (typeof lines === 'string') {
    ui.div(lines)

    return ui.toString()
  }

  lines.forEach((line) => {
    if (!line) return
    if (Array.isArray(line)) {
      ui.div(...line.map(text => ({ text, padding })))
    } else {
      ui.div({ text: line, padding })
    }
  })

  return ui.toString()
}


export const joinSections = (...xs: Section[]) => xs
  .map(formatSection)
  .filter(x => x.length > 0)
  .join('\n\n')
