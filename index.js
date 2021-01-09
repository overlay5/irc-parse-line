// Parser for IRC protocol messages RFC 2812 + IRCv3 message-tag extension
// (c) 2020 Evgeny Zislis <evgeny.zislis@gmail.com>
// Released under the MIT License
// ** https://tools.ietf.org/html/rfc2812
// ** https://ircv3.net/specs/extensions/message-tags.html

// Based on:
// https://github.com/grawity/irc-parse-tests
// Parser for IRC protocol messages (RFC 1459 + IRCv3 message-tag extension)
// (c) 2012-2014 Mantas Mikulėnas <grawity@gmail.com>
// Released under the MIT License (dist/LICENSE.mit)

/**
 * The returned object from a parsed IRC line
 *
 * @typedef {{
 *   verb: string,
 *   servername: string,
 *   source: string,
 *   user: string,
 *   host: string,
 *   tags: [ [string, string|boolean] ],
 *   params: [ string ]
 * }} ParsedIrcLine
 */

class InvalidMessage extends Error {
  message

  constructor(message = 'Parsing failed') {
    super(message)
    this.message = `IRC Invalid Message: ${message}`
  }
}

const RE_EOL = /[\r\n]*$/g
const RE_CMD_VALIDATION = /^(\d{3}|[A-Za-z]+)$/

const TAGS_UNESCAPE = {
  ':': ';',
  's': ' ',
  '\\': '\\',
  'r': '\r',
  'n': '\n',
}

/**
 * Find next non-space character starting from current position
 * Per RFC1459 multiple space separation is allowed
 *
 * @param {string} message the irc message
 * @param {number} currentPos index of the current position in message
 * @returns {number} first non space position after currentPos
 */
function nonSpacePos(message, currentPos) {
  let pos = currentPos
  while (message[pos] === ' ')
    pos++
  return pos
}

/**
 * Returns the position of last character in the message,
 * excluding any whitespace and/or \r\n characters at eol.
 *
 * @param {string} message the message
 * @param {number} currentPos current position in the message
 * @returns {number} the end of line position (length of message)
 */
function findEol(message, currentPos) {
  RE_EOL.lastIndex = currentPos
  const match = RE_EOL.exec(message)
  return match ? match.index : message.length
}

/**
 * Parse a single line IRC message
 *
 * @param {string} line the irc message to parse
 * @returns {ParsedIrcLine} object with verb, tags and params of parsed irc message
 */
function parseIrcLine(line) {
  /** @type {ParsedIrcLine} */
  const parsed = {}

  let pos = 0

  if (!line || typeof line !== 'string')
    throw new InvalidMessage()

  if (line[pos] === '@') {
    pos++ // skip '@' at the start of tags
    const tagsEnd = line.indexOf(' ', pos)
    let escNext = false
    parsed.tags = line.slice(pos, tagsEnd)
      .split(';')
      .map(tag => {
        let [k, v] = tag.split('=')
        if (v && v.length > 0)
          v = v.split('').map((char, idx, arr) => {
            if (escNext) {
              const unescapedTags = TAGS_UNESCAPE[char]
              escNext = false
              return typeof (unescapedTags) === 'undefined' ? char : unescapedTags
            } else {
              if (char === '\\')
                escNext = true
              else
                return char
            }
          }).join('')
        return [k, typeof v === 'undefined' ? true : v]
      })
    pos = nonSpacePos(line, tagsEnd + 1)
  }

  if (line[pos] === ':') {
    pos++ // ':' at the start of prefix
    const prefixEnd = line.indexOf(' ', pos)
    const prefix = line.slice(pos, prefixEnd)
    const dotPos = prefix.indexOf('.')
    const userPos = prefix.indexOf('!')
    const hostPos = prefix.indexOf('@', userPos - 1)
    if (userPos !== -1 && hostPos !== -1) {
      parsed.source = prefix.slice(0, userPos)
      parsed.user = prefix.slice(userPos + 1, hostPos)
      parsed.host = prefix.slice(hostPos + 1)
    } else if (hostPos !== -1) {
      parsed.source = prefix.slice(0, hostPos)
      parsed.host = prefix.slice(hostPos + 1)
    } else if (dotPos !== -1) {
      parsed.source = prefix
    } else {
      parsed.source = prefix
    }
    pos = nonSpacePos(line, prefixEnd + 1) // start after ' ' after prefix
  }

  let verbEnd = line.indexOf(' ', pos)
  if (verbEnd === -1)
    verbEnd = findEol(line, pos)
  parsed.verb = line.slice(pos, verbEnd)
  RE_CMD_VALIDATION.lastIndex = pos
  if (!RE_CMD_VALIDATION.test(parsed.verb))
    throw new InvalidMessage()
  pos = nonSpacePos(line, verbEnd + 1) // start after ' ' after prefix

  const parametersEnd = findEol(line, pos)
  const trailParamStart = line.indexOf(':', pos)

  parsed.params = []

  if (parsed.verb) {
    if (trailParamStart === -1) {
      parsed.params = line.slice(pos, parametersEnd).split(' ')
      while (parsed.params[parsed.params.length - 1] === '')
        parsed.params.pop()
    } else { parsed.params = line.slice(pos, trailParamStart - 1).split(' ') }
    if (parsed.params[parsed.params.length - 1] === '')
      parsed.params.pop()
    if (trailParamStart !== -1)
      parsed.params.push(line.slice(trailParamStart + 1, findEol(line)))

    if (parsed.params.length === 0)
      delete parsed.params
  }

  return parsed
}

module.exports = {
  parseIrcLine,
  findEol,
  nonSpacePos,
  InvalidMessage
}
