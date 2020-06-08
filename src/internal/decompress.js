const { basename, extname } = require('path')
const zip = require('./zip')
const gz = require('./gz')

module.exports = async (opts, stream, archive) => {
  let filter = () => true

  switch (extname(archive)) {
    case '.zip':
      return await zip(stream, filter)
    case '.gz':
      return await gz(stream, filter)
    default:
      return [{ filename: basename(archive), content: stream }]
  }
}
