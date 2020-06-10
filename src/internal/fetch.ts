import http from 'http'
import https from 'https'
import { Logger, logEvents } from './logger'

type RequestOptions = { log: Logger }
type Response = http.IncomingMessage

const success = (x?: number) => x && x >= 200 && x <= 299
const redirect = (x?: number) => x && x >= 300 && x <= 399

const logRequest = (log: Logger, uri: string) => logEvents({
  log,
  events: ['response'],
  defaultType: 'tick',
  args: [uri],
  message: (event: string) => {
    switch (event) {
      case 'response': return 'Request complete for'
      default: return event
    }
  },
})

const logResponse = (log: Logger, uri: string) => logEvents({
  log,
  events: ['data', 'end'],
  defaultType: 'tick',
  args: [uri],
  message: (event: string) => {
    switch (event) {
      case 'data': return 'Response chunk for'
      case 'end': return 'Response complete for'
      default: return event
    }
  },
})

const request = async ({ log }: RequestOptions, uri: string, source?: string): Promise<Response> => {
  if (source) {
    log('tick', 'Redirecting', source)
  } else {
    log('tick', 'Requesting', uri)
  }

  let logReq = logRequest(log, source || uri)
  let logRes = logResponse(log, source || uri)

  let secure = uri.startsWith('https:')
  let makeRequest = secure ? https.request : http.request
  let requestOptions: http.RequestOptions = {}

  return new Promise((res, rej) => {
    let onResponse = (x: http.IncomingMessage) => res(logRes(x))
    let httpRequest = logReq(makeRequest(uri, requestOptions, onResponse))

    httpRequest
      .on('timeout', () => httpRequest.destroy(new Error(`Request timed out: ${uri}`)))
      .on('error', rej)
      .end()
  })
}

const followRedirects = (opts: RequestOptions, source: string, max: number) => (response: Response): Promise<Response> => {
  let { statusCode, headers } = response
  let { location } = headers

  if (max > 1 && redirect(statusCode) && location) {
    return request(opts, location, source).then(followRedirects(opts, source, max - 1))
  } else {
    return Promise.reject(new Error(`Too many redirects: ${source}`))
  }
}

const ensureSuccessStatusCode = (url: string) => (response: Response) => {
  let { statusCode } = response

  if (success(statusCode)) {
    return response
  } else {
    throw new Error(`Response status code does not indicate success: ${statusCode} ${url}`)
  }
}

export const fetch = (opts: RequestOptions, uri: string) => request(opts, uri)
  .then(followRedirects(opts, uri, 5))
  .then(ensureSuccessStatusCode(uri))
