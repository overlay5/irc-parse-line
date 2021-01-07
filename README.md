# IRC Message Parser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The simplest possible IRC message parser, with the most extensible suite of tests.

### Usage:

```javascript
const { parseIrcLine } = require('irc-parser')
parseIrcLine('@tag1=value1;tag2;vendor1/tag3=value2;vendor2/tag4 COMMAND param1 param2 :param3 param3"')
/* Returns the following:
 *    {
 *      tags: [
 *        [ 'tag1', 'value1' ],
 *        [ 'tag2', '' ],
 *        [ 'vendor1/tag3', 'value2' ],
 *        [ 'vendor2/tag4', '' ]
 *      ],
 *      verb: 'COMMAND',
 *      params: [ 'param1', 'param2', 'param3 param3"' ]
 *    }
 */
```

The object returned by `parseIrcLine(line: string)` has the following fields:

| field name and type                | description  |
|------------------------------------|--------------|
|`verb: string`                      | command used
|`servername: string`                | server name (when specified)
|`source: string`                    | source of the message, often the user nick name
|`user: string`                      | user sending the message
|`host: string`                      | source host for this message
|`tags: [{ string: string\|boolean }]`| IRC message tags
|`params: [string]`                  | IRC message parameters, including trailing parameter
