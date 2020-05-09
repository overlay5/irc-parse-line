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

  xit('should parse GLOBALUSERSTATE commands', function () {
    const result = parse(':tmi.twitch.tv GLOBALUSERSTATE')
    assert.deepEqual(result.command, 'GLOBALUSERSTATE')
  })

})
