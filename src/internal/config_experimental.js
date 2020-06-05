const url = require('url')

const isDarwin = (platform) =>
  platform.includes('mac')
  || platform.includes('darwin')
  || platform.includes('osx')

  const isLinux = (platform) => platform.includes('linux')

  const isWin = (platform) => platform.includes('win')

const WINDOWS = 'win32'
const LINUX = 'linux'
const DARWIN = 'darwin'

const toNodePlatformId = (platform) => {
  if (isLinux(platform)) return LINUX
  if (isWin(platform)) return WINDOWS
  if (isDarwin(platform)) return DARWIN

  return null
}

const eq = (target) => (x) => toNodePlatformId(x) === target

const isAbsolute = (x) => url.parse(x).host !== null

const resolve = (uri, base) => {
  if (isAbsolute(uri)) {
    return uri
  } else if (base) {
    // todo: remove multiple slashes
    return `${base}/${uri}`
  } else {
    throw new Error(`Unable to resolve relative url ${template}. Either specify absolute url or 'base' option`)
  }
}

const segment = (points, xs) => {
  let len = 0
  let strings = []
  let variables = []

  let rest = points.reduce(
    (source, [a, b]) => {
      let start = a - len
      let end = b - len
      len = b

      let head = source.slice(0, start)
      let curr = source.slice(start, end)
      let tail = source.slice(end)

      strings.push(head)
      variables.push(curr)

      return tail
    },
    xs,
  )

  if (rest.length > 0) {
    strings.push(rest)
    variables.push('')
  }

  return [strings, variables]
}

const formatTemplate = (template, vars) => {
  let reg = /(\{\w+\})/g
  let matches = Array.from(template.matchAll(reg))

  let toBreakpoint = (match) => [match.index, match.index + match[0].length]
  let points = matches.map(toBreakpoint)
  let [strings, variables] = segment(points, template)

  return strings.reduce(
    (acc, str, i) => {
      let key = variables[i].slice(1, -1)
      let val = key in vars ? vars[key] : variables[i]

      return `${acc}${str}${val}`
    },
    '',
  )
}

const toUrl = ({ platform: target }) => ([name, value]) => {
  if (typeof value === 'string') {
    return { name, url: value }
  }

  let { base, urls, version, platforms } = value


  let platform = Array.isArray(platforms)
  ? platforms.find(eq(target))
  : target

  urls = typeof urls === 'string' ? { [platform]: urls } : urls

  if (platform === null || urls[platform] === undefined) {
    throw new Error(`Platform for ${target} not found`)
  }

  let template = urls[platform]
  let relative = formatTemplate(template, { name, version, platform })

  return resolve(relative, base)
}

const config = {
  version: 'v0.26.2',
  platforms: ['linux64', 'win64', 'mac'],
  base: 'https://github.com/loadimpact/k6/releases/download',
  urls: '{version}/k6-{version}-{platform}.zip',
}

const res = toUrl({ platform: 'linux' })(['k6', config])

console.log(res)
