export type FileType =
  | 'zip'
  | 'gzip'
  | 'xz'
  | 'tar'
  | 'bzip'
  | 'bzip2'
  | '7z'
  | 'rar'
  | 'binary'
  | 'other'
  | 'unknown'

const inferFromMime = (contentType?: string): FileType => {
  if (!contentType) {
    return 'unknown'
  }

  let [mime] = contentType.split(';')
  let [, type] = mime.split('/')

  switch (type.toLowerCase()) {
    case 'zip': return 'zip'
    case 'gzip': return 'gzip'
    case 'x-xz': return 'xz'
    case 'x-tar': return 'tar'
    case 'x-bzip': return 'bzip'
    case 'x-bzip2': return 'bzip2'
    case 'x-7z-compressed': return '7z'
    case 'vnd.rar': return 'rar'
    case 'octet-stream': return 'binary'
    default: return 'other'
  }
}

const inferFromExtension = (ext: string): FileType => {
  switch (ext.toLowerCase()) {
    case '.zip': return 'zip'
    case '.gz': return 'gzip'
    case '.xz': return 'xz'
    case '.tar': return 'tar'
    case '.bz': return 'bzip'
    case '.bz2': return 'bzip2'
    case '.7z': return '7z'
    case '.rar': return 'rar'
    case '.exe': return 'binary'
    default: return 'unknown'
  }
}

const typeWeight = (type: FileType) => {
  switch (type) {
    case 'unknown': return 0
    case 'other': return 1
    default: return 2
  }
}

export const inferFileType = (ext: string, contentType?: string): FileType => {
  let extType = inferFromExtension(ext)
  let extWeight = typeWeight(extType)

  let mimeType = inferFromMime(contentType)
  let mimeWeight = typeWeight(mimeType)

  return extWeight >= mimeWeight ? extType : mimeType
}
