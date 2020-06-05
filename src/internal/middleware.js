module.exports = (...xs) => xs.reduceRight(
    (prev, next) => ctx => next(ctx, prev),
    () => { throw new Error('No middleware handled the context') },
)
