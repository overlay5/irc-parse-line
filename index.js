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

class InvalidMessage extends Error {
  message
  constructor(message = "Parsing failed") {
    super()
    this.message = `IRC Invalid Message: ${message}`
  }
}

const RE_EOL = / *[\r\n]*$/g
const RE_CMD_VALIDATION = /^(\d{3}|[A-Za-z]+)$/

/**
 * Find next non-space character starting from current position
 * Per RFC1459 multiple space separation is allowed
 *
 * @param {string} message the irc message
 * @param {number} currentPos
 * @returns {number} first non space position after currentPos
 */
function nonSpacePos (message, currentPos) {
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
function findEol (message, currentPos) {
  RE_EOL.lastIndex = currentPos
  const match = RE_EOL.exec(message)
  return match ? match.index : message.length
}

/**
 * Parse a single line IRC message
 *
 * @param {string} line the irc message to parse
 * @returns object with command, tags and params of parsed irc message
 */
function parseIrcLine (line) {
  /**
   * @type {{
   *   command: string,
   *   servername: string,
   *   nickname: string,
   *   user: string,
   *   host: string,
   *   tags: { string: string|boolean },
   *   params: { string: any }
   * }}
   */
  const parsed = {}

  let pos = 0

  if (!line || typeof line !== 'string')
    throw new InvalidMessage()

  if (line[pos] === '@') {
    pos++ // skip '@' at the start of tags
    const tagsEnd = line.indexOf(' ', pos)
    parsed.tags = line.slice(pos, tagsEnd)
      .split(';')
      .map(tag => {
        const [k, v] = tag.split('=')
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
      parsed.nickname = prefix.slice(0, userPos)
      parsed.user = prefix.slice(userPos + 1, hostPos)
      parsed.host = prefix.slice(hostPos + 1)
    } else if (hostPos !== -1) {
      parsed.nickname = prefix.slice(0, hostPos)
      parsed.host = prefix.slice(hostPos + 1)
    } else if (dotPos !== -1) {
      parsed.servername = prefix
    } else {
      parsed.nickname = prefix
    }
    pos = nonSpacePos(line, prefixEnd + 1) // start after ' ' after prefix
  }

  let commandEnd = line.indexOf(' ', pos)
  if (commandEnd === -1)
    commandEnd = findEol(line, pos)
  parsed.command = line.slice(pos, commandEnd)
  RE_CMD_VALIDATION.lastIndex = pos
  parsed.command
  if (!RE_CMD_VALIDATION.test(parsed.command))
    throw new InvalidMessage()
  pos = nonSpacePos(line, commandEnd + 1) // start after ' ' after prefix

  const parametersEnd = findEol(line, pos)

  parsed.params = {}

  switch (parsed.command) {
    case 'ROOMSTATE': // twitch extension - more in tags
    case 'USERSTATE': // twitch extension - more in tags
    case 'JOIN':
    case 'PART':
      parsed.params.channel = line.slice(pos, parametersEnd)
      break
    case 'MODE':
      const [channel, modes, modeparams] = line.slice(pos, parametersEnd).split(' ')
      if (!/^[#+&]/.test(channel))
        throw new InvalidMessage()
      parsed.params = { channel, modes, modeparams }
      break
    case 'PRIVMSG':
      const msgtargetsEnd = line.indexOf(':')
      parsed.params.target = line.slice(pos, msgtargetsEnd - 1).trim()
      parsed.params.message = line.slice(msgtargetsEnd + 1, parametersEnd)
      break
  }

  return parsed
}

module.exports = {
  parseIrcLine,
  findEol,
  nonSpacePos,
  InvalidMessage
}
