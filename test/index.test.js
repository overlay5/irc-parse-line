const { describe, it } = require('mocha')
const assert = require('assert').strict
const { parseIrcLine, InvalidMessage, findEol, nonSpacePos } = require('../index')

describe('find eol', () => {
  it('should return the length of provided string', () => {
    assert.equal(findEol('1234567'), 7, 'length of string')
    assert.equal(findEol('1234567', 2), 7, 'length when starting from non-0 position')
    assert.equal(findEol('1234567\r', 2), 7, 'length of string ignoring \\r at eol')
    assert.equal(findEol('1234567 \r', 2), 7, 'length of string ignoreing spaces and \\r at eol')
    assert.equal(findEol('1234567\n', 2), 7, 'length of string ignoring \\n at eol')
    assert.equal(findEol('1234567 \n', 2), 7, 'length of string ignoring spaces and \\n at eol')
    assert.equal(findEol('1234567\r\n', 2), 7, 'length of string ignoring mixed \\r\\n at eol')
    assert.equal(findEol('1234567\n\r', 2), 7, 'length of string ignoring mixed \\r\\n at eol')
    assert.equal(findEol('1234567 \r\n', 2), 7, 'length of string ignoring spaces and mixed \\r\\n at eol')
    assert.equal(findEol('1234567 \n\r', 2), 7, 'length of string ignoring spaces and mixed \\r\\n at eol')
    assert.equal(findEol('1234567    \r\n', 2), 7, 'length of string ignoring spaces and mixed \\r\\n at eol')
  })
})

describe('find next non-space pos', () => {
  it('should find the next non-space position', () => {
    assert.equal(nonSpacePos('123   xy', 4), 6, 'position of the next non-space character in the string')
  })
})

describe('irc message', () => {
  it('should throw an error on non-string or empty messages', () => {
    assert.throws(() => { parseIrcLine() }, InvalidMessage)
    assert.throws(() => { parseIrcLine('') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(4) }, InvalidMessage)
    assert.throws(() => { parseIrcLine([]) }, InvalidMessage)
    assert.throws(() => { parseIrcLine({}) }, InvalidMessage)
    assert.throws(() => { parseIrcLine('      ') }, InvalidMessage)
  })

  it('should parse a message that contains "tags", "prefix", "command" and "params"', () => {
    const result = parseIrcLine('@x;y=;z=abc :nick!user@host.name JOIN #kesor6')
    assert.deepEqual(result, {
      tags: [['x', true], ['y', ''], ['z', 'abc']],
      nickname: 'nick',
      user: 'user',
      host: 'host.name',
      command: 'JOIN',
      params: { channel: '#kesor6' }
    })
  })

  it('should parse "prefix" that includes servername', () => {
    const result = parseIrcLine(':tmi.twitch.tv CAP * ACK :twitch.tv/tags')
    assert.equal(result.servername, 'tmi.twitch.tv')
    assert.equal(result.nickname, undefined)
  })

  it('should parse "prefix" that includes full nickname', () => {
    const result = parseIrcLine(':nightbot!botnight@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
    assert.equal(result.user, 'botnight')
    assert.equal(result.host, 'nightbot.tmi.twitch.tv')
    assert.equal(result.servername, undefined)
  })

  it('should parse "prefix" that includes partial nickname', () => {
    const result = parseIrcLine(':nightbot@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
    assert.equal(result.host, 'nightbot.tmi.twitch.tv')
    assert.equal(result.user, undefined)
  })

  it('should parse "prefix" that includes just the nickname', () => {
    const result = parseIrcLine(':nightbot JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
    assert.equal(result.user, undefined)
    assert.equal(result.host, undefined)
  })

  it('should parse message tags', () => {
    const result = parseIrcLine('@enabled-tag;color=#0000FF;empty-value=;display-name=kesor6 GLOBALUSERSTATE')
    assert.deepEqual(result.tags, [
      ['enabled-tag', true],
      ['color', '#0000FF'],
      ['empty-value', ''],
      ['display-name', 'kesor6']
    ])
  })

  it('should parse tags separated by multiple spaces from prefix', () => {
    const result = parseIrcLine('@tagbool;tag-empty=;tag-val=xx    :prefixuser!named@at.server.com  JOIN #kesor6')
    assert.deepEqual(result.tags, [
      [ 'tagbool', true ],
      [ 'tag-empty', '', ],
      [ 'tag-val', 'xx' ]
    ])
    assert.equal(result.nickname, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
  })

  it('should parse a command separated by multiple spaces from prefix', () => {
    const result = parseIrcLine(':prefixuser!named@at.server.com   JOIN   #kesor6')
    assert.equal(result.nickname, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
    assert.equal(result.command, 'JOIN')
  })

  it('should parse commands', () => {
    const result = parseIrcLine('PING')
    assert.equal(result.command, 'PING')
    assert.doesNotThrow(() => { parseIrcLine('123') })
    assert.doesNotThrow(() => { parseIrcLine('CAP') })
    assert.doesNotThrow(() => { parseIrcLine('PING') })
  })

  it('should throw exception on illegal or missing commands', () => {
    assert.throws(() => { parseIrcLine('1') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('12') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('1234') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag :withuser!named@at.server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag :withuser@at.server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(':onlyuser@server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(':onlyuser!named@server') }, InvalidMessage)
  })

  it('should recognize commands without parameters', () => {
    assert.equal(parseIrcLine('PING').command, 'PING')
    assert.equal(parseIrcLine('PING ').command, 'PING')
    assert.equal(parseIrcLine('PING \r\n').command, 'PING')
    assert.equal(parseIrcLine('PING\r\n').command, 'PING')
    assert.equal(parseIrcLine('PING\n\r').command, 'PING') // not rfc compliant, but tolerable
    assert.equal(parseIrcLine('PING \n\r').command, 'PING') // not rfc compliant, but tolerable
  })

  it('should read the channel from commands that support a channel parameters', () => {
    assert.equal(parseIrcLine('JOIN').command, 'JOIN')
    assert.equal(parseIrcLine('JOIN #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('JOIN   #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('JOIN #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('JOIN #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('PART').command, 'PART')
    assert.equal(parseIrcLine('PART #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('PART   #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('PART #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('PART #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('ROOMSTATE').command, 'ROOMSTATE')
    assert.equal(parseIrcLine('ROOMSTATE #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('ROOMSTATE   #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('ROOMSTATE #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('ROOMSTATE #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('USERSTATE').command, 'USERSTATE')
    assert.equal(parseIrcLine('USERSTATE #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('USERSTATE   #kesor6').params.channel, '#kesor6')
    assert.equal(parseIrcLine('USERSTATE #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parseIrcLine('USERSTATE #kesor6 \r\n').params.channel, '#kesor6')
  })

  it('should support the channel MODE command', () => {
    const result = parseIrcLine('MODE #Finnish +o Kilroy')
    assert.equal(result.params.channel, '#Finnish')
    assert.equal(result.params.modes, '+o')
    assert.equal(result.params.modeparams, 'Kilroy')
  })

  it('should throw errors on user MODE commands', () => {
    assert.throws(() => { parseIrcLine('MODE Wiz -o') }, InvalidMessage)
  })

  it('should support PRIVMSG with a single target', () => {
    const result = parseIrcLine('PRIVMSG Angel :yes I\'m receiving it !')
    assert.equal(result.command, 'PRIVMSG')
    assert.equal(result.params.target, 'Angel')
    assert.equal(result.params.message, 'yes I\'m receiving it !')

    assert.equal(parseIrcLine('PRIVMSG  #kesor6  :some text').params.target, '#kesor6')
    assert.equal(parseIrcLine('PRIVMSG  #kesor6  :some text').params.message, 'some text')
    assert.equal(parseIrcLine('PRIVMSG  #kesor6  :some text\r\n').params.target, '#kesor6')
    assert.equal(parseIrcLine('PRIVMSG  #kesor6  :some text\r\n').params.message, 'some text')
    // assert.throws(() => { parseIrcLine('PRIVMSG Angel ') }, InvalidMessage)
  })
})
