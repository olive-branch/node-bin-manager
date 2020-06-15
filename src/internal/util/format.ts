export type Section = {
  title: string,
  lines?: string | Array<undefined | string | string[]>,
}

export const formatSection = (section: Section): string[] => {
  let rowPadding = ' '.repeat(2)
  let colPadding = 40

  if (!section.lines || section.lines.length === 0) {
    return []
  }

  if (typeof section.lines === 'string') {
    return [section.title, section.lines]
  }

  let lines = section.lines.map((xs) => {
    if (Array.isArray(xs)) {
      let [a, b] = xs
      let line = `${a.padEnd(colPadding)}${b}`
      return `${rowPadding}${line}`
    } else {
      return `${rowPadding}${xs}`
    }
  })

  return [
    section.title,
    ...lines,
  ]
}

export const joinSections = (...xs: Section[]) => xs
  .map(formatSection)
  .filter(x => x.length > 0)
  .map(x => `${x.join('\n')}`)
  .join('\n\n')
