import { join } from 'path'
import { pathRoot, ROOT_DIR } from './path'

describe('pathRoot', () => {
  let data: [string, string][] = [
    ['', ''],
    ['.', '.'],
    ['one', 'one'],
    ['one/two', 'one'],
    ['./one/two', './one'],
    ['one/two/three', 'one'],
    [join(ROOT_DIR, 'one', 'two'), join(ROOT_DIR, 'one')],
  ]

  data.forEach(([init, expected]) => it(`root of '${init}' is '${expected}'`, () => {
    let actual = pathRoot(init)

    expect(actual).toEqual(expected)
  }))
})
