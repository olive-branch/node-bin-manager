import ora from 'ora'
import { CreateLoggerOptions, LogMessageType } from './types'

const formatMessage = ({ debug }: CreateLoggerOptions, ...values: any[]) => values.reduce(
  (acc, x) => {
    if (x === null || x === undefined || x === '') {
      return acc
    }
    if (x instanceof Error && debug) {
      return `${acc} ${x.stack}`
    }

    return `${acc} ${x}`
  },
  '',
)

export const quietHandler = () => {}

export const rawHandler = (opts: CreateLoggerOptions) => (_: LogMessageType, ...args: any[]) => {
  let msg = formatMessage(opts, ...args)

  console.log(msg)

  return true
}

export const spinnerHandler = (opts: CreateLoggerOptions) => {
  let spinner = ora()

  let updateText = (msg: string) => { spinner.text = msg }

  return (type: LogMessageType, value: any, ...rest: any[]) => {
    let msg = formatMessage(opts, value, ...rest)

    switch (type) {
      case 'start': {
        spinner.start(msg)
        return true
      }
      case 'stop': {
        updateText('')
        if (msg) {
          spinner.succeed(msg)
          spinner.stopAndPersist()
        } else {
          spinner.stop()
        }
        return true
      }
      case 'tick': {
        let [url] = rest
        updateText(`${value} ${url}`)
        return true
      }
      case 'panic': {
        updateText('')
        spinner.fail(msg)
        spinner.stopAndPersist()
        return true
      }
      case 'error': {
        let { text, isSpinning } = spinner
        updateText('')
        spinner.fail(msg)
        if (isSpinning) {
          spinner.stopAndPersist()
          spinner.start(text)
        }
        return true
      }
      default: {
        if (spinner.isSpinning) {
          updateText(msg)
          return true
        }
        return false
      }
    }
  }
}
