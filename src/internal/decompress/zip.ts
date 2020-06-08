import { ZipFile, Entry, fromBuffer } from 'yauzl'
import { Readable } from 'stream'
import { DecompressionHandler, DecompressCallback } from './types'

const toBuffer = (stream: Readable): Promise<Buffer> => new Promise((res, rej) => {
  let chunks: Buffer[] = []
  stream.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  stream.on('end', () => res(Buffer.concat(chunks)))
  stream.on('error', err => rej(new Error(`Unable to read file stream: ${err.message}`)))
})

const unzipBuffer = (buf: Buffer, cb: DecompressCallback): Promise<void> => new Promise((res, rej) => {
  let handleEntry = (zip: ZipFile) => (entry: Entry) => {
    let filepath = entry.fileName
    let isFile = !filepath.endsWith('/')

    if (isFile) {
      zip.openReadStream(entry, (err, content) => {
        if (err) {
          rej(err)
        } else if (content) {
          cb(content, filepath).then(() => zip.readEntry())
        } else {
          rej(new Error('Invalid file stream'))
        }
      })
    } else {
      zip.readEntry()
    }
  }

  fromBuffer(buf, { lazyEntries: true }, (err, zip) => {
    if (err) {
      rej(err)
      return
    }
    if (!zip) {
      rej(new Error('No content found in zip archive'))
      return
    }

    zip
      .on('entry', handleEntry(zip))
      .on('end', () => res())
      .on('error', e => rej(new Error(`Unable to decompress archive using zip: ${e.message}`)))
      .readEntry()
  })
})

export const unzip: DecompressionHandler = async (source, cb) => {
  let buf = await toBuffer(source)

  return unzipBuffer(buf, cb)
}
