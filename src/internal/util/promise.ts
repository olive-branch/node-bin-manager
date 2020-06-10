export function sequential<T>(xs: Array<() => Promise<T>>, onrejected?: (e: Error) => T): Promise<T[]> {
  return xs.reduce(
    (acc, f) => acc.then(prevs => f().catch(onrejected).then(x => [...prevs, x])),
    Promise.resolve([] as T[]),
  )
}

export function concurrent<T>(xs: Array<() => Promise<T>>, onrejected?: (e: Error) => T): Promise<T[]> {
  return Promise.all(xs.map(f => f().catch(onrejected)))
}
