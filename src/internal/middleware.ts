export type Next<A, B> = (context: A) => B
export type Middleware<A, B> = (context: A, next: Next<A, B>) => B

export function middleware<A, B>(...xs: Middleware<A, B>[]): Next<A, B> {
  return xs.reduceRight<Next<A, B>>(
    (prev, next) => (ctx: A) => next(ctx, prev),
    () => { throw new Error('No middleware handled the context') },
  )
}
