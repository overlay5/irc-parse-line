// Fetch the suite of IRC parser tests (Python package) from GitHub -
// original Python package is published by Daniel Oaks <daniel@danieloaks.net>

const process = require('process')
const http = require('https')
const fs = require('fs')
const assert = require('assert')
const TESTS_YAML_FILE = 'test/msg-split.yaml'
const TESTS_YAML_URL = 'https://raw.githubusercontent.com/ircdocs/parser-tests/master/tests/msg-split.yaml'

const testsYamlStream = fs.createWriteStream(TESTS_YAML_FILE)

process.stdout.write(`Downloading test suite YAML '${TESTS_YAML_FILE}' ...\n`)
http.get(TESTS_YAML_URL, (response) => {
  const { statusCode } = response
  assert.equal(statusCode, 200, `Request failed.\nStatus code: ${statusCode}`)

  response.setEncoding('utf-8')
  response.pipe(testsYamlStream)
  response.resume()
  response.on('end', () => {
    process.stdout.write(`Created '${TESTS_YAML_FILE}' for testing.\n`)
  })
})
