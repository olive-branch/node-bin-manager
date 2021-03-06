import fs from 'fs'
import { Readable } from 'stream'
import { decompress, DecompressOption } from './decompress'

type File = { content: Readable, filepath: string }
const sut = (opts: DecompressOption, src: Readable, filename: string) =>
  decompress(opts, src, { filename }, async (content, filepath) => ({ content, filepath } as File))

describe('decompress', () => {
  it('decompress zip', async () => {
    let filepath = './data/multiple.zip'
    let src = fs.createReadStream(filepath)

    let actual = await sut({}, src, filepath)

    let expected = [
      'one.txt',
      'two.txt',
      'sub/three.txt',
    ]

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('decompress tar.gz', async () => {
    let filepath = './data/multiple.tar.gz'
    let src = fs.createReadStream(filepath)

    let actual = await sut({}, src, filepath)

    let expected = [
      'two.txt',
      'sub/three.txt',
      'one.txt',
    ]

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('include root', async () => {
    let filepath = './data/single.tar.gz'
    let src = fs.createReadStream(filepath)

    let actual = await sut({ includeRootDir: true }, src, filepath)

    let expected = ['single/file.txt']

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('exclude files', async () => {
    let filepath = './data/multiple.tar.gz'
    let exclude = [/sub\//ig]
    let src = fs.createReadStream(filepath)

    let actual = await sut({ exclude }, src, filepath)

    let expected = ['two.txt', 'one.txt']

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('include files', async () => {
    let filepath = './data/multiple.tar.gz'
    let include = [/sub\//ig]
    let src = fs.createReadStream(filepath)

    let actual = await sut({ include }, src, filepath)

    let expected = ['sub/three.txt']

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('ignore take precedence over invlude', async () => {
    let filepath = './data/multiple.tar.gz'
    let regexp = /sub\//ig
    let src = fs.createReadStream(filepath)

    let actual = await sut({ include: [regexp], exclude: [regexp] }, src, filepath)

    let expected: string[] = []

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('decompress archive without root dir', async () => {
    let filepath = './data/rootless.zip'
    let src = fs.createReadStream(filepath)

    let actual = await sut({}, src, filepath)

    let expected: string[] = ['rootless.txt']

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('complete stream read', async () => {
    let filepath = './data/multiple.tar.gz'
    let src = fs.createReadStream(filepath)

    let actual = await sut({}, src, filepath)

    expect(actual.some(x => x.content.readable)).toBeFalsy()
  })
})
