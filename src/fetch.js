const http = require('http')
const https = require('https')

const success = x => 200 <= x && x <= 299
const redirect = x => 300 <= x && x <= 399

const request = (uri) => {
  let secure = uri.startsWith('https:')
  let req = secure ? https.request : http.request

  return new Promise((res) => req(uri, {}, res).end())
}

const followRedirects = (max) => (response) => {
  let { statusCode, headers } = response
  let location = headers.location

  if (max > 1 && redirect(statusCode) && location) {
    return request(location).then(followRedirects(max - 1))
  } else {
    return response
  }
}

const ensureSuccessStatusCode = (url) => (response) => {
  let { statusCode } = response

  if (success(statusCode)) {
    return response
  } else {
    throw new Error(`Response status code does not indicate success: ${statusCode} ${url}`)
  }
}

module.exports = (uri) => request(uri)
  .then(followRedirects(5))
  .then(ensureSuccessStatusCode(uri))
