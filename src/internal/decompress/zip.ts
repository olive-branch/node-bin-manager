import { ZipFile, Entry, fromBuffer } from 'yauzl'
import { Readable } from 'stream'
import { DecompressionHandler, FileFilter, ArchiveFile } from './types'

const toBuffer = (stream: Readable): Promise<Buffer> => new Promise((res, rej) => {
  let chunks: Buffer[] = []
  stream.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  stream.on('end', () => res(Buffer.concat(chunks)))
  stream.on('error', err => rej(new Error(`Unable to read file stream: ${err.message}`)))
})

const unzipBuffer = (buf: Buffer, filter: FileFilter): Promise<ArchiveFile[]> => new Promise((res, rej) => {
  let handleEntry = (zip: ZipFile) => (entry: Entry) => {
    let filename = entry.fileName
    let isDirectory = filename.endsWith('/')

    if (isDirectory || !filter(filename)) {
      zip.readEntry()
    } else {
      zip.openReadStream(entry, (err, content) => {
        if (err) {
          rej(err)
        } else if (content) {
          res([{ filename, content }])
        } else {
          rej(new Error('Invalid file stream'))
        }
      })
    }
  }

  let handleZip = (err: any, zip: ZipFile) => {
    if (err) {
      rej(err)
      return
    }

    zip.readEntry()

    zip.on('entry', handleEntry(zip))
    zip.on('error', e => rej(new Error(`Unable to decompress archive using zip: ${e.message}`)))
    zip.on('end', () => rej(new Error('No executables found in archive')))
  }

  fromBuffer(buf, { lazyEntries: true }, handleZip)
})

export const unzip: DecompressionHandler = async (source, filter) => {
  let buf = await toBuffer(source)

  return unzipBuffer(buf, filter)
}
