const ProgressBar = require('progress')
const { COLOR, colortag, white, yellow, green, red } = require('./color')


let logger = () => {
  let incomplete = ' '
  let complete = `█`
  let width = process.stdout.columns > 80 ? 80 : process.stdout.columns
  let label = white`[load]`
  let bar = colortag(COLOR.fgGreen)`:bar`
  let format = `${label} ${bar} :percent`
  let progress

  return (type, value, ...rest) => {
    switch (type) {
      case 'start':
        progress = new ProgressBar(format, { width, incomplete, complete, total: value })
        break
      case 'tick':
        if (progress) {
          !progress.complete && progress.tick(value)
        } else {
          throw new Error('ProgressBar not set yet. Make sure to call `start` before `tick`')
        }
        break
      case 'info':
        console.log(green`[${type}]`, value, ...rest)
        break
      case 'warn':
        console.log(yellow`[${type}]`, value, ...rest)
        break
      case 'error':
        console.error(red`[${type}]`, value, ...rest)
        break
      default:
        console.log(`[${type}]`, value, ...rest)
    }
  }
}

module.exports = logger
