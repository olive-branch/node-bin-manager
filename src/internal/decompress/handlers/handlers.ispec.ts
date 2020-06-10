import fs from 'fs'
import { Readable } from 'stream'
import { handleGzip } from './gz'
import { handleZip } from './zip'
import { handleXz } from './xz'
import { DecompressionHandler } from './types'

const data = {
  gz: {
    ext: '.tar.gz',
    handler: handleGzip,
  },
  xz: {
    ext: '.tar.xz',
    handler: handleXz,
  },
  zip: {
    ext: '.zip',
    handler: handleZip,
  },
}

type File = { content: Readable, filepath: string }

const createSut = (handler: DecompressionHandler) => (src: Readable): Promise<File[]> => new Promise((res, rej) => {
  let files: File[] = []

  let promise = handler(src, async (content, filepath) => {
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

Object.entries(data).forEach(([name, { ext, handler }]) => {
  describe(name, () => {
    let archive = (x: string) => `./data/${x}${ext}`
    let empty = archive('empty')
    let single = archive('single')
    let multiple = archive('multiple')
    let rootless = archive('rootless')
    let sut = createSut(handler)

    it('unzip empty', async () => {
      let src = fs.createReadStream(empty)

      let actual = await sut(src)

      expect(actual).toHaveLength(0)
    })

    it('unzip rootless archive', async () => {
      let src = fs.createReadStream(rootless)

      let actual = await sut(src)

      let expected: string[] = ['rootless.txt']

      expect(actual.map(x => x.filepath)).toEqual(expected)
    })

    it('unzip single-file', async () => {
      let src = fs.createReadStream(single)

      let actual = await sut(src)
      let expected = [
        'single/file.txt',
      ]

      expect(actual.map(x => x.filepath)).toEqual(expected)
    })

    it('unzip multiple-file', async () => {
      let src = fs.createReadStream(multiple)

      let actual = await sut(src)

      let expected = [
        'multiple/one.txt',
        'multiple/sub/three.txt',
        'multiple/two.txt',
      ]

      expect(actual.map(x => x.filepath).sort()).toEqual(expected)
    })

    it('read archived file', async () => {
      let src = fs.createReadStream(multiple)

      let files = await sut(src)
      let content = files.find(x => x.filepath === 'multiple/sub/three.txt')?.content

      let actual = content ? await readToString(content) : null
      let expected = 'test test test\n'

      expect(actual).toEqual(expected)
    })

    it('rejects if callback rejects', async () => {
      let src = fs.createReadStream(single)

      let actual = handler(src, () => Promise.reject(new Error('test')))

      await expect(actual).rejects.toThrowError('test')
    })
  })
})
