const config = require('./jest.config')

module.exports = {
  ...config,
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
}
