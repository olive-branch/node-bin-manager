import fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export type Platform =
  | 'darwin'
  | 'linux'
  | 'win32'

export type PlatformUrl = { [K in Platform]?: string }

export type DependencyEntry = string | PlatformUrl

export type Config = {
  binDependencies?: {
    [name: string]: DependencyEntry
  }
}

export type ParseEntryOptions = { platform: Platform }
export const parseEntry = ({ platform }: ParseEntryOptions) => ([key, value]: [string, DependencyEntry]) => {
  if (typeof value === 'string') {
    return [key, value]
  }
  if (typeof value === 'object') {
    return [key, value[platform]]
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

export const updateConfig = async (configPath: string, key: string, value: PlatformUrl) => {
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
