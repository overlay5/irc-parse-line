/* eslint-disable mocha/no-setup-in-describe */
const assert = require('assert').strict
const { parseIrcLine, InvalidMessage, findEol, nonSpacePos } = require('../index')

describe('find eol', function () {
  it('should return the length of provided string', function () {
    assert.equal(findEol('1234567'), 7, 'length of string')
    assert.equal(findEol('1234567', 2), 7, 'length when starting from non-0 position')
    assert.equal(findEol('1234567\r', 2), 7, 'length of string ignoring \\r at eol')
    assert.equal(findEol('1234567\n', 2), 7, 'length of string ignoring \\n at eol')
    assert.equal(findEol('1234567\r\n', 2), 7, 'length of string ignoring mixed \\r\\n at eol')
    assert.equal(findEol('1234567\n\r', 2), 7, 'length of string ignoring mixed \\r\\n at eol')
  })
})

describe('find next non-space pos', function () {
  it('should find the next non-space position', function () {
    assert.equal(nonSpacePos('123   xy', 4), 6, 'position of the next non-space character in the string')
  })
})

describe('irc message', function () {
  it('should throw an error on non-string or empty messages', function () {
    assert.throws(() => { parseIrcLine() }, InvalidMessage)
    assert.throws(() => { parseIrcLine('') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(4) }, InvalidMessage)
    assert.throws(() => { parseIrcLine([]) }, InvalidMessage)
    assert.throws(() => { parseIrcLine({}) }, InvalidMessage)
    assert.throws(() => { parseIrcLine('      ') }, InvalidMessage)
  })

  it('should parse a message that contains "tags", "prefix", "verb" and "params"', function () {
    const result = parseIrcLine('@x;y=;z=abc :nick!user@host.name JOIN #kesor6')
    assert.deepEqual(result, {
      tags: [['x', ''], ['y', ''], ['z', 'abc']],
      source: 'nick',
      user: 'user',
      host: 'host.name',
      verb: 'JOIN',
      params: ['#kesor6']
    })
  })

  it('should parse "prefix" that includes servername', function () {
    const result = parseIrcLine(':tmi.twitch.tv CAP * ACK :twitch.tv/tags')
    assert.equal(result.source, 'tmi.twitch.tv')
  })

  it('should parse "prefix" that includes full nickname', function () {
    const result = parseIrcLine(':nightbot!botnight@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.source, 'nightbot')
    assert.equal(result.user, 'botnight')
    assert.equal(result.host, 'nightbot.tmi.twitch.tv')
  })

  it('should parse "prefix" that includes partial nickname', function () {
    const result = parseIrcLine(':nightbot@nightbot.tmi.twitch.tv JOIN #kesor6')
    assert.equal(result.source, 'nightbot')
    assert.equal(result.host, 'nightbot.tmi.twitch.tv')
    assert.equal(result.user, undefined)
  })

  it('should parse "prefix" that includes just the nickname', function () {
    const result = parseIrcLine(':nightbot JOIN #kesor6')
    assert.equal(result.source, 'nightbot')
    assert.equal(result.user, undefined)
    assert.equal(result.host, undefined)
  })

  it('should parse message tags', function () {
    const result = parseIrcLine('@enabled-tag;color=#0000FF;empty-value=;display-name=kesor6 GLOBALUSERSTATE')
    assert.deepEqual(result.tags, [
      ['enabled-tag', ''],
      ['color', '#0000FF'],
      ['empty-value', ''],
      ['display-name', 'kesor6']
    ])
  })

  it('should parse tags separated by multiple spaces from prefix', function () {
    const result = parseIrcLine('@tagbool;tag-empty=;tag-val=xx    :prefixuser!named@at.server.com  JOIN #kesor6')
    assert.deepEqual(result.tags, [
      ['tagbool', ''],
      ['tag-empty', ''],
      ['tag-val', 'xx']
    ])
    assert.equal(result.source, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
  })

  it('should parse a verb separated by multiple spaces from prefix', function () {
    const result = parseIrcLine(':prefixuser!named@at.server.com   JOIN   #kesor6')
    assert.equal(result.source, 'prefixuser')
    assert.equal(result.user, 'named')
    assert.equal(result.host, 'at.server.com')
    assert.equal(result.verb, 'JOIN')
  })

  it('should parse verbs', function () {
    const result = parseIrcLine('PING')
    assert.equal(result.verb, 'PING')
    assert.doesNotThrow(() => { parseIrcLine('123') })
    assert.doesNotThrow(() => { parseIrcLine('CAP') })
    assert.doesNotThrow(() => { parseIrcLine('PING') })
  })

  it('should throw exception on illegal or missing verbs', function () {
    assert.throws(() => { parseIrcLine('1') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('12') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('1234') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag :withuser!named@at.server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine('@just-tag :withuser@at.server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(':onlyuser@server') }, InvalidMessage)
    assert.throws(() => { parseIrcLine(':onlyuser!named@server') }, InvalidMessage)
  })

  it('should recognize verbs without parameters', function () {
    assert.equal(parseIrcLine('PING').verb, 'PING')
    assert.equal(parseIrcLine('PING ').verb, 'PING')
    assert.equal(parseIrcLine('PING \r\n').verb, 'PING')
    assert.equal(parseIrcLine('PING\r\n').verb, 'PING')
    assert.equal(parseIrcLine('PING\n\r').verb, 'PING') // not rfc compliant, but tolerable
    assert.equal(parseIrcLine('PING \n\r').verb, 'PING') // not rfc compliant, but tolerable
  })

  it('should read the channel from verbs that support a channel parameters', function () {
    assert.equal(parseIrcLine('JOIN').verb, 'JOIN')
    assert.deepEqual(parseIrcLine('JOIN #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('JOIN   #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('JOIN #kesor6\r\n').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('JOIN #kesor6 \r\n').params, ['#kesor6'])
    assert.equal(parseIrcLine('PART').verb, 'PART')
    assert.deepEqual(parseIrcLine('PART #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('PART   #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('PART #kesor6\r\n').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('PART #kesor6 \r\n').params, ['#kesor6'])
    assert.equal(parseIrcLine('ROOMSTATE').verb, 'ROOMSTATE')
    assert.deepEqual(parseIrcLine('ROOMSTATE #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('ROOMSTATE   #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('ROOMSTATE #kesor6\r\n').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('ROOMSTATE #kesor6 \r\n').params, ['#kesor6'])
    assert.equal(parseIrcLine('USERSTATE').verb, 'USERSTATE')
    assert.deepEqual(parseIrcLine('USERSTATE #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('USERSTATE   #kesor6').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('USERSTATE #kesor6\r\n').params, ['#kesor6'])
    assert.deepEqual(parseIrcLine('USERSTATE #kesor6 \r\n').params, ['#kesor6'])
  })

  it('should support the channel MODE verb', function () {
    const result = parseIrcLine('MODE #Finnish +o Kilroy')
    assert.deepEqual(result.params, ['#Finnish', '+o', 'Kilroy'])
  })

  it('should support PRIVMSG with a single target', function () {
    const result = parseIrcLine('PRIVMSG Angel :yes I\'m receiving it !')
    assert.equal(result.verb, 'PRIVMSG')
    assert.deepEqual(result.params, ['Angel', 'yes I\'m receiving it !'])

    assert.deepEqual(parseIrcLine('PRIVMSG  #kesor6  :some text').params, ['#kesor6', 'some text'])
    assert.deepEqual(parseIrcLine('PRIVMSG  #kesor6  :some text\r\n').params, ['#kesor6', 'some text'])
  })
})

describe('external test suite', function () {
  const yaml = require('yaml')
  const yamlFile = require('fs').readFileSync('test/msg-split.yaml', { encoding: 'utf-8' })
  const tests = yaml.parse(yamlFile).tests

  for (const test of tests)
    it(`should pass ${JSON.stringify(test)}`, function () {
      const result = parseIrcLine(test.input)
      if (Object.keys(result).includes('tags')) // thats the way "they" like it
        result.tags = Object.fromEntries(result.tags)
      if (Object.keys(result).includes('source')) { // thats the way "they" like it
        if (Object.keys(result).includes('user'))
          result.source = `${result.source}!${result.user}`
        if (Object.keys(result).includes('host'))
          result.source = `${result.source}@${result.host}`
        delete result.user
        delete result.host
      }
      assert.deepEqual(result, test.atoms, yaml.stringify({ message: test.msg, input: test.input, expect: test.atoms, result }))
    })
})
