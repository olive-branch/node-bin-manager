import { RestoreOptions } from './types'

export const parseEntry = ({ platform }: RestoreOptions) => ([key, value]: [string, any]) => {
  if (typeof value === 'string') {
    return [key, value]
  }
  if (typeof value === 'object') {
    return [key, value[platform]]
  }

  throw new TypeError(`Invalid binDependency format for ${key}. Value should be either string or object`)
}
