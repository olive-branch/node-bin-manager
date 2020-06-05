const { basename, extname } = require('path')
const zip = require('./zip')
const gz = require('./gz')

module.exports = async (stream, archive, { ext }) => {
  let isExe = file => extname(file) === ext

  let filename, content

  switch (extname(archive)) {
    case '.zip':
      [filename, content] = await zip(stream, isExe)
      return { filename, content }
    case '.gz':
      [filename, content] =  await gz(stream, isExe)
      return { filename, content }
    default:
      return { filename: basename(archive), content: stream }
  }
}
