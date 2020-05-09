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

class InvalidMessage extends Error {}

/**
 * Parsing a single line IRC message
 * @param {string} message the irc message to parse
 */
function parse(message) {
  if (!message)
    throw new InvalidMessage

  let pos = 0
  const parsed = {}

  if (message[pos] === '@') {
    pos++ // '@' at the start of tags
    const tags_end = message.indexOf(' ', pos)
    parsed.tags = Object.fromEntries(
      message.slice(pos, tags_end)
      .split(';')
      .map(tag => {
        [k,v] = tag.split('=')
        return [k, typeof v === 'undefined' ? true : v]
      })
    )
    pos = tags_end + 1
    while (message[pos] === ' ') // per RFC1459 multiple space separation is allowed
      pos++
  }

  if (message[pos] === ':') {
    pos++ // ':' at the start of prefix
    const prefix_end = message.indexOf(' ', pos)
    const prefix = message.slice(pos, prefix_end)
    const dot_pos = prefix.indexOf('.')
    const user_pos = prefix.indexOf('!')
    const host_pos = prefix.indexOf('@', user_pos-1)
    if (user_pos !== -1 && host_pos !== -1) {
      parsed.nickname = prefix.slice(0,user_pos)
      parsed.user = prefix.slice(user_pos+1,host_pos)
      parsed.host = prefix.slice(host_pos+1)
    } else if (host_pos !== -1) {
      parsed.nickname = prefix.slice(0,host_pos)
      parsed.host = prefix.slice(host_pos+1)
    } else if (dot_pos !== -1) {
      parsed.servername = prefix
    } else {
      parsed.nickname = prefix
    }
    pos = prefix_end + 1 // the ' ' at the end of prefix
    while (message[pos] === ' ') // per RFC1459 multiple space separation is allowed
      pos++
  }

  let command_end = message.indexOf(' ', pos)
  if (command_end === -1)
    command_end = message.length
  parsed.command =  message.slice(pos, command_end)
  if (!parsed.command || !RegExp(/^(\d{3}|[A-Za-z]+)$/).test(parsed.command))
    throw new InvalidMessage
  pos = command_end

  return parsed
}

module.exports = {
  parse,
  InvalidMessage
}
