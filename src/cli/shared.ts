import { Middleware } from '../internal/util/middleware'

export type CliCommand = Middleware<string[], Promise<number>>
