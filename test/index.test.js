const assert = require('assert').strict
const { parse, InvalidMessage } = require('../index')

describe('irc message', function () {
  it('should throw an error on invalid messages', function () {
    assert.throws(function () { parse()    }, InvalidMessage)
    assert.throws(function () { parse('')  }, InvalidMessage)
    // assert.throws(function () { parse(4)   }, InvalidMessage)
    // assert.throws(function () { parse([])  }, InvalidMessage)
    // assert.throws(function () { parse({})  }, InvalidMessage)
    // assert.throws(function () { parse('JOIN') }, InvalidMessage)
  })

  it('should parse a prefix with a servername', function () {
    const result = parse(':tmi.twitch.tv CAP * ACK :twitch.tv/tags')
    assert.equal(result.servername, 'tmi.twitch.tv')
  })

  it('should parse a prefix with a full nickname', function () {
    const result = parse(':nightbot!botnight@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
    assert.equal(result.user,     'botnight')
    assert.equal(result.host,     'nightbot.tmi.twitch.tv')
  })

  it('should parse a prefix with a partial nickname', function () {
    const result = parse(':nightbot@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
    assert.equal(result.host,     'nightbot.tmi.twitch.tv')
  })

  it('should parse a prefix with a short nickname', function () {
    const result = parse(':nightbot JOIN #kesor6')
    assert.equal(result.nickname, 'nightbot')
  })

  it('should parse tags before the message', function () {
    const result = parse('@enabled-tag;color=#0000FF;empty-value=;display-name=kesor6 :tmi.twitch.tv GLOBALUSERSTATE')
    assert.deepEqual(result.tags, {
      'enabled-tag': true,
      'color': '#0000FF',
      'empty-value': '',
      'display-name': 'kesor6',
    })
  })

  it('should parse commands', function () {
    const result = parse('PING')
    assert.equal(result.command, 'PING')
  })

  it('should parse tags separated by multiple spaces from prefix', function () {
    const result = parse('@tagbool;tag-empty=;tag-val=xx    :prefixuser!named@at.server.com  JOIN #kesor6')
    assert.deepEqual(result.tags, { tagbool: true, 'tag-empty': '', 'tag-val': 'xx' })
    assert.equal(result.nickname, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
  })

  it('should parse a command separated by multiple spaces from prefix', function () {
    const result = parse(':prefixuser!named@at.server.com   JOIN   #kesor6')
    assert.equal(result.nickname, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
    assert.equal(result.command, 'JOIN')
  })

  it('should throw exception on illegal commands', function () {
    assert.doesNotThrow(function () { parse('123') })
    assert.doesNotThrow(function () { parse('CAP') })
    assert.doesNotThrow(function () { parse('PING') })
    assert.throws(function () { parse('1234') }, InvalidMessage)
    assert.throws(function () { parse('@just-tag') }, InvalidMessage)
    assert.throws(function () { parse('@just-tag :withuser!named@at.server') }, InvalidMessage)
    assert.throws(function () { parse('@just-tag :withuser@at.server') }, InvalidMessage)
    assert.throws(function () { parse(':onlyuser@server') }, InvalidMessage)
    assert.throws(function () { parse(':onlyuser!named@server') }, InvalidMessage)
  })

  it('should recognize commands without parameters', function () {
    assert.equal(parse('PING').command, 'PING')
    assert.equal(parse('PING ').command, 'PING')
    assert.equal(parse('PING \r\n').command, 'PING')
    assert.equal(parse('PING\r\n').command, 'PING')
  })

  it('should read the channel from commands that support a channel parameters', function () {
    assert.equal(parse('JOIN').command, 'JOIN')
    assert.equal(parse('JOIN #kesor6').params.channel, '#kesor6')
    assert.equal(parse('JOIN   #kesor6').params.channel, '#kesor6')
    assert.equal(parse('JOIN #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parse('JOIN #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parse('PART').command, 'PART')
    assert.equal(parse('PART #kesor6').params.channel, '#kesor6')
    assert.equal(parse('PART   #kesor6').params.channel, '#kesor6')
    assert.equal(parse('PART #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parse('PART #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parse('ROOMSTATE').command, 'ROOMSTATE')
    assert.equal(parse('ROOMSTATE #kesor6').params.channel, '#kesor6')
    assert.equal(parse('ROOMSTATE   #kesor6').params.channel, '#kesor6')
    assert.equal(parse('ROOMSTATE #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parse('ROOMSTATE #kesor6 \r\n').params.channel, '#kesor6')
    assert.equal(parse('USERSTATE').command, 'USERSTATE')
    assert.equal(parse('USERSTATE #kesor6').params.channel, '#kesor6')
    assert.equal(parse('USERSTATE   #kesor6').params.channel, '#kesor6')
    assert.equal(parse('USERSTATE #kesor6\r\n').params.channel, '#kesor6')
    assert.equal(parse('USERSTATE #kesor6 \r\n').params.channel, '#kesor6')
  })

})
