const { extname } = require('path')
const zip = require('./zip')
const gz = require('./gz')

const isExecutable = (platform) => {
  platform = platform.split('-')[0]

  return (file) => {
    let ext = extname(file)

    switch (platform) {
      case 'win32':
        return ext === '.exe'
      case 'darwin':
      case 'linux':
        return ext === ''
      default:
        return false
    }
  }
}

module.exports = async (archive, platform, stream) => {
  switch (extname(archive)) {
    case '.zip':
      return await zip(stream, isExecutable(platform))
    case '.gz':
      return await gz(stream, isExecutable(platform))
    default:
      return [archive, stream]
  }
}
