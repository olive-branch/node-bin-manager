export function flatten<T>(xs: T[][]): T[] {
  return Array<T>().concat(...xs)
}
