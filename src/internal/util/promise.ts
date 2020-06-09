export function sequential<T>(xs: Array<() => Promise<T>>): Promise<T[]> {
  return xs.reduce(
    (acc, f) => acc.then(prevs => f().then(x => [...prevs, x])),
    Promise.resolve([] as T[]),
  )
}

export function concurrent<T>(xs: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(xs.map(f => f()))
}
