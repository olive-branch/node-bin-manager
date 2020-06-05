const ProgressBar = require('progress')
const { COLOR, colortag } = require('./color')

const white = colortag(COLOR.bgWhite, COLOR.fgBlack)
const red = colortag(COLOR.bgRed, COLOR.fgBlack)
const green = colortag(COLOR.bgGreen, COLOR.fgBlack)
const yellow = colortag(COLOR.bgYellow, COLOR.fgBlack)

const formatType = x => ` ${x.toUpperCase()} `

const progressHandler = () => {
  let incomplete = ' '
  let complete = `█`
  let width = process.stdout.columns > 80 ? 80 : process.stdout.columns
  let clear = true

  let label = white([formatType('load')])
  let bar = colortag(COLOR.fgGreen)`:bar`
  let format = `${label} ${bar} :percent`

  let progress

  let create = (total) => new ProgressBar(format, { width, incomplete, complete, clear, total })
  let running = () => progress && !progress.complete
  let tick = (value) => running() && progress.tick(value)

  let stop = () => {
    if (running()) {
      progress.terminate()
      progress = undefined
    }
  }

  return (type, value) => {
    switch (type) {
      case 'start':
        progress = create(value)
        return true
      case 'stop':
        stop()
        return true
      case 'tick':
        tick(value)
        return true
      default:
        stop()
        return false
    }
  }
}

const logHandler = () => (type, value, ...rest) => {
  let label = formatType(type)

  switch (type) {
    case 'info':
      console.log(green([label]), value, ...rest)
      break
    case 'warn':
      console.log(yellow([label]), value, ...rest)
      break
    case 'error':
      label = formatType('fail')
      console.error(red([label]), value, ...rest)
      break
    default:
      console.log(formatType, value, ...rest)
  }
}

const combine = (...handlers) => (type, value, ...rest) =>
  handlers.some(f => f(type, value, ...rest))

module.exports = () => combine(
  progressHandler(),
  logHandler(),
)
