const config = require('./jest.config')

module.exports = {
  ...config,
  testRegex: '(/__tests__/.*|(\\.|/)(itest|ispec))\\.tsx?$',
}
