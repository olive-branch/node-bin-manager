import fs from 'fs'
import { Readable } from 'stream'
import { unzip } from './zip'

type File = { content: Readable, filepath: string }
const sut = (src: Readable): Promise<File[]> => new Promise((res, rej) => {
  let files: File[] = []

  let promise = unzip(src, async (content, filepath) => {
    files.push({ content, filepath })
  })

  promise.then(() => res(files)).catch(rej)
})

const readToString = (stream: Readable): Promise<string> => new Promise((res, rej) => {
  let result = ''

  stream
    .on('data', (chunk: string | Buffer) => {
      let part = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
      result += part
    })
    .on('end', () => res(result))
    .on('error', e => rej(e))
})

describe('zip', () => {
  it('can unzip empty', async () => {
    let src = fs.createReadStream('./data/empty.zip')

    let actual = await sut(src)

    expect(actual).toHaveLength(0)
  })

  it('can unzip single-file', async () => {
    let src = fs.createReadStream('./data/single.zip')

    let actual = await sut(src)
    let expected = [
      'single/file.txt',
    ]

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('can unzip multiple-file', async () => {
    let src = fs.createReadStream('./data/multiple.zip')

    let actual = await sut(src)

    let expected = [
      'multiple/one.txt',
      'multiple/two.txt',
      'multiple/sub/three.txt',
    ]

    expect(actual.map(x => x.filepath)).toEqual(expected)
  })

  it('can read archived file', async () => {
    let src = fs.createReadStream('./data/multiple.zip')

    let files = await sut(src)
    let content = files.find(x => x.filepath === 'multiple/sub/three.txt')?.content

    let actual = content ? await readToString(content) : null
    let expected = 'test test test\n'

    expect(actual).toEqual(expected)
  })
})
