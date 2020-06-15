import fs from 'fs'
import { join, resolve } from 'path'
import { installCommand, CommandArgs } from './install'

const { binDependencies } = require('../../../bin.config.json')

const formatArgs = (args: string[], opts: { [key: string]: any }) => Object.entries(opts).reduce(
  (acc, [k, v]) => {
    if (v === null || v === undefined) {
      return acc
    } else {
      return [...acc, `--${k}`, `${v}`]
    }
  },
  ['node', 'app', ...args],
)

const { handler } = installCommand()
const sut = (opts: CommandArgs, ...args: string[]) => handler(
  formatArgs(args, opts),
  () => { throw new Error('Unable to handle') },
)

const options = (x?: Partial<CommandArgs>): CommandArgs => ({
  out: 'tmp',
  platform: 'linux',
  config: 'bin.config.json',
  quiet: true,
  raw: false,
  seq: false,
  debug: true,
  force: true,
  cwd: undefined,
  key: undefined,
  ...x,
})

describe('install', () => {
  jest.setTimeout(5 * 60 * 1e3)

  it('restore from config', async () => {
    let out = 'tmp/restore'
    let opts = options({ out })
    await rmdir(out)

    let code = await sut(opts, 'install')
    expect(code).toEqual(0)

    let actual = await fs.promises.readdir(out)
    let expected = ['consul', 'deno', 'influx', 'k6']

    expect(actual).toEqual(expected)
  })

  it('install new', async () => {
    let url = binDependencies.deno.linux
    let config = 'tmp/install/config.json'
    let out = 'tmp/install/'
    let opts = options({ config, out })
    await rmdir(out)

    let actualCode = await sut(opts, 'install', url)
    let expectedCode = 0
    expect(actualCode).toEqual(expectedCode)

    let actualFiles = await fs.promises.readdir(out)
    let expectedFiles = ['config.json', 'deno']
    expect(actualFiles).toEqual(expectedFiles)

    // eslint-disable-next-line global-require, import/no-dynamic-require
    let actualConfig = require(resolve(config))
    let expectedConfig = {
      binDependencies: {
        deno: { out, linux: url },
      },
    }
    expect(actualConfig).toEqual(expectedConfig)
  })
})


async function rmdir(path: string) {
  if (!fs.existsSync(path)) {
    return
  }

  let files = await fs.promises.readdir(path)
  let rmFiles = files.map(x => join(path, x)).map(fs.promises.unlink)

  await Promise.all(rmFiles)
  await fs.promises.rmdir(path)
}
