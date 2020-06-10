import { inferFileType, FileType } from './fileType'

const data: Array<[string, string | undefined, FileType]> = [
  ['', undefined, 'unknown'],
  ['.exe', undefined, 'binary'],
  ['.zip', undefined, 'zip'],
  ['.tar', undefined, 'tar'],
  ['.gz', undefined, 'gzip'],
  ['.exe', 'application/octet-stream', 'binary'],
  ['.txt', 'application/octet-stream', 'binary'],
  ['', 'application/gzip', 'gzip'],
  ['', 'text/plain', 'other'],
]

describe('fileType', () => {
  data.forEach(([ext, mime, expected]) => {
    let name = `| ${ext.padEnd(5)} | ${(mime || '').padEnd(25)} | ${expected.padEnd(7)} |`

    it(name, () => {
      let actual = inferFileType(ext, mime)

      expect(actual).toEqual(expected)
    })
  })
})
