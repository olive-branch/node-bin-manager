import http from 'http'
import https from 'https'

type Response = http.IncomingMessage

const success = (x?: number) => x && x >= 200 && x <= 299
const redirect = (x?: number) => x && x >= 300 && x <= 399

const request = (uri: string): Promise<Response> => {
  let secure = uri.startsWith('https:')
  let req = secure ? https.request : http.request

  return new Promise(res => req(uri, {}, res).end())
}

const followRedirects = (max: number) => (response: Response): Promise<Response> => {
  let { statusCode, headers } = response
  let { location } = headers

  if (max > 1 && redirect(statusCode) && location) {
    return request(location).then(followRedirects(max - 1))
  } else {
    return Promise.resolve(response)
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

export const fetch = (uri: string) => request(uri)
  .then(followRedirects(5))
  .then(ensureSuccessStatusCode(uri))
