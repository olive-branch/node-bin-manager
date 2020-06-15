import fs from 'fs'
import { promisify } from 'util'
import { makeRe } from 'minimatch'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const fromGlob = (x: string) => makeRe(x, { })

export type Platform =
  | 'darwin'
  | 'linux'
  | 'win32'

type DependecySources = { [K in Platform]?: string }

export type DependencyOptions = DependecySources & {
  url?: string,
  out?: string,
  exclude?: string[],
  include?: string[],
}

export type DependencyEntry = string | DependencyOptions

export type Config = {
  binDependencies?: {
    [name: string]: DependencyEntry
  }
}

export type ParseEntryOptions = { platform: Platform, out: string }
export type DependencyConfig = {
  key: string,
  out: string,
  exclude: RegExp[],
  include: RegExp[],
  url?: string,
}
export const fromEntries = ({ platform, out }: ParseEntryOptions) => ([key, value]: [string, DependencyEntry]): DependencyConfig => {
  if (typeof value === 'string') {
    return { key, out, url: value, exclude: [], include: [] }
  }
  if (typeof value === 'object') {
    let url = value[platform] || value.url
    let include = Array.isArray(value.include) ? value.include.map(fromGlob) : []
    let exclude = Array.isArray(value.exclude) ? value.exclude.map(fromGlob) : []

    return { key, url, include, exclude, out: value.out || out }
  }

  throw new TypeError(`Invalid binDependency format for ${key}. Value should be either string or object`)
}

export const loadConfig = async (configPath: string, dontThrow?: boolean): Promise<Config> => {
  if (fs.existsSync(configPath)) {
    let content = await readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } else if (dontThrow) {
    return {}
  } else {
    throw new Error('Unable to locate package.json in your working directory')
  }
}

export const updateConfig = async (configPath: string, key: string, value: DependencyOptions) => {
  let config = await loadConfig(configPath, true)

  let binDependencies = config.binDependencies || {}
  let entry = binDependencies[key]
  let prevValue = typeof entry === 'string' ? { '?': entry } : entry

  let newConfig: Config = {
    ...config,
    binDependencies: {
      ...binDependencies,
      [key]: {
        ...prevValue,
        ...value,
      },
    },
  }

  await writeFile(configPath, JSON.stringify(newConfig, null, 2))

  return newConfig
}
