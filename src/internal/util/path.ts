import { dirname, parse } from 'path'

export const ROOT_DIR = parse(process.cwd()).root

export const pathRoot = (filepath: string) => {
  let parent = filepath
  let dir = dirname(parent)

  while (dir !== '.' && dir !== ROOT_DIR) {
    parent = dir
    dir = dirname(parent)
  }

  return parent
}

