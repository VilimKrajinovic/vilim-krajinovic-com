const withTm = require('next-transpile-modules')(['three'])
const compose = require('next-compose')

module.exports = compose([withTm])
