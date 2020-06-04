const ProgressBar = require('progress')

module.exports = () => {
  let bar

  return (type, value) => {
    switch (type) {
      case 'start':
        bar = new ProgressBar('Downloading :bar :percent%', { total: value })
        break
      case 'tick':
        if (bar) {
          bar.tick(value)
        } else {
          throw new Error('ProgressBar not set yet. Make sure to call `start` before `tick`')
        }
        break
      default:
        console.log(`[${type}] ${value}`)
    }
  }
}
