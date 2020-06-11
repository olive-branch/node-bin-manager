const replaceAt = <T>(xs: T[], idx: number, value: T): T[] => {
  let arr = xs.slice()
  arr[idx] = value

  return arr
}

export const bounce = (width: number, emptyChar: string, activeChar: string): string[] => {
  let template = new Array<string>(width).fill(emptyChar)
  let empty = template.join('')
  let count = (width + 1) * 2 - 1

  return new Array<string[]>(count).fill(template).reduce(
    (prev, str, i) => {
      let bacward = Math.floor(i / width) % 2 === 1
      let idx = bacward ? width - (i % width) : i % width
      let arr = idx === 0 ? str : replaceAt(str, idx - 1, activeChar)

      let curr = arr.join('')

      return idx === width
        ? [...prev, curr, empty, curr]
        : [...prev, curr]
    },
    [],
  )
}
