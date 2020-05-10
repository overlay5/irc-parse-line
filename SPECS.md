### IRCv3 Message Tags Extension

* https://ircv3.net/specs/extensions/message-tags.html

```
<message>       ::= ['@' <tags> <SPACE>] [':' <prefix> <SPACE> ] <command> <params> <crlf>
<tags>          ::= <tag> [';' <tag>]*
<tag>           ::= <key> ['=' <escaped_value>]
<key>           ::= [ <client_prefix> ] [ <vendor> '/' ] <key_name>
<client_prefix> ::= '+'
<key_name>      ::= <non-empty sequence of ascii letters, digits, hyphens ('-')>
<escaped_value> ::= <sequence of zero or more utf8 characters except NUL, CR, LF, semicolon (`;`) and SPACE>
<vendor>        ::= <host>
```

### RFC 1459 Section 2.3.1

* https://tools.ietf.org/html/rfc1459

```
<message>    ::= [':' <prefix> <SPACE> ] <command> <params> <crlf>
<prefix>     ::= <servername> | <nick> [ '!' <user> ] [ '@' <host> ]
<command>    ::= <letter> { <letter> } | <number> <number> <number>
<SPACE>      ::= ' ' { ' ' }
<params>     ::= <SPACE> [ ':' <trailing> | <middle> <params> ]
<middle>     ::= <Any *non-empty* sequence of octets not including SPACE or NUL or CR or LF, the first of which may not be ':'>
<trailing>   ::= <Any, possibly *empty*, sequence of octets not including NUL or CR or LF>
<crlf>       ::= CR LF
<target>     ::= <to> [ "," <target> ]
<to>         ::= <channel> | <user> '@' <servername> | <nick> | <mask>
<channel>    ::= ('#' | '&') <chstring>
<servername> ::= <host>
<host>       ::= see RFC 952 [DNS:4] for details on allowed hostnames
<nick>       ::= <letter> { <letter> | <number> | <special> }
<mask>       ::= ('#' | '$') <chstring>
<chstring>   ::= <any 8bit code except SPACE, BELL, NUL, CR, LF and comma (',')>
<user>       ::= <nonwhite> { <nonwhite> }
<letter>     ::= 'a' ... 'z' | 'A' ... 'Z'
<number>     ::= '0' ... '9'
<special>    ::= '-' | '[' | ']' | '\' | '`' | '^' | '{' | '}'
<nonwhite>   ::= <any 8bit code except SPACE (0x20), NUL (0x0), CR (0xd), and LF (0xa)>
```


### RFC 2812 Section 2.3.1

* https://tools.ietf.org/html/rfc2812

```
message    =  [ ":" prefix SPACE ] command [ params ] crlf
prefix     =  servername / ( nickname [ [ "!" user ] "@" host ] )
command    =  1*letter / 3digit
params     =  *14( SPACE middle ) [ SPACE ":" trailing ]
           =/ 14( SPACE middle ) [ SPACE [ ":" ] trailing ]
nospcrlfcl =  %x01-09 / %x0B-0C / %x0E-1F / %x21-39 / %x3B-FF
                ; any octet except NUL, CR, LF, " " and ":"
middle     =  nospcrlfcl *( ":" / nospcrlfcl )
trailing   =  *( ":" / " " / nospcrlfcl )
SPACE      =  %x20        ; space character
crlf       =  %x0D %x0A   ; "carriage return" "linefeed"
target     =  nickname / server
msgtarget  =  msgto *( "," msgto )
msgto      =  channel / ( user [ "%" host ] "@" servername )
msgto      =/ ( user "%" host ) / targetmask
msgto      =/ nickname / ( nickname "!" user "@" host )
channel    =  ( "#" / "+" / ( "!" channelid ) / "&" ) chanstring [ ":" chanstring ]
servername =  hostname
host       =  hostname / hostaddr
hostname   =  shortname *( "." shortname )
shortname  =  ( letter / digit ) *( letter / digit / "-" )
              *( letter / digit )
                ; as specified in RFC 1123 [HNAME]
hostaddr   =  ip4addr / ip6addr
ip4addr    =  1*3digit "." 1*3digit "." 1*3digit "." 1*3digit
ip6addr    =  1*hexdigit 7( ":" 1*hexdigit )
ip6addr    =/ "0:0:0:0:0:" ( "0" / "FFFF" ) ":" ip4addr
nickname   =  ( letter / special ) *8( letter / digit / special / "-" )
targetmask =  ( "$" / "#" ) mask
                ; see details on allowed masks in section 3.3.1
chanstring =  %x01-07 / %x08-09 / %x0B-0C / %x0E-1F / %x21-2B
chanstring =/ %x2D-39 / %x3B-FF
                ; any octet except NUL, BELL, CR, LF, " ", "," and ":"
channelid  = 5( %x41-5A / digit )   ; 5( A-Z / 0-9 )
user       =  1*( %x01-09 / %x0B-0C / %x0E-1F / %x21-3F / %x41-FF )
                ; any octet except NUL, CR, LF, " " and "@"
key        =  1*23( %x01-05 / %x07-08 / %x0C / %x0E-1F / %x21-7F )
                ; any 7-bit US_ASCII character,
                ; except NUL, CR, LF, FF, h/v TABs, and " "
letter     =  %x41-5A / %x61-7A       ; A-Z / a-z
digit      =  %x30-39                 ; 0-9
hexdigit   =  digit / "A" / "B" / "C" / "D" / "E" / "F"
special    =  %x5B-60 / %x7B-7D
                 ; "[", "]", "\", "`", "_", "^", "{", "|", "}"
```


## Client-to-Client Protocol (CTCP)

* https://tools.ietf.org/id/draft-oakley-irc-ctcp-01.html

CTCP queries are sent with the PRIVMSG IRC command, and CTCP replies
are sent with NOTICE command. To indicate a CTCP query or reply, the
body of the message (the second parameter) begins with the CTCP delimiter.

```
  delim    = %x01
  command  = 1*( %x02-09 / %x0B-0C / %x0E-1F / %x21-FF )
                ; any octet except NUL, delim, CR, LF, and " "
  params   = 1*( %x02-09 / %x0B-0C / %x0E-FF )
                ; any octet except NUL, delim, CR, and LF
  body     = delim command [ SPACE params ] [ delim ]
```

Example:

    :dan!u@localhost PRIVMSG #ircv3 :\x01ACTION writes some specs!\x01

## CTCP Commands

*  Metadata query

    :alice!a@localhost PRIVMSG bob :\x01VERSION\x01
    :bob!b@localhost NOTICE alice :\x01VERSION SaberChat 27.5\x01

* Extended query

    :alice!a@localhost PRIVMSG bob :\x01PING 1473523796 918320\x01
    :bob!b@localhost NOTICE alice :\x01PING 1473523796 918320\x01

* A.1 ACTION
  * Type:    Extended Formatting
  * Params:  ACTION <text>

* A.2 CLIENTINFO
  * Type:   Extended Query
  * Reply:  CLIENTINFO <tokens>

* A.3 DCC
  * Type:    Extended Query
  * Params:  DCC <type> <argument> <host> <port>

* A.4 FINGER
  * Type:   Metadata Query
  * Reply:  FINGER <info>

* A.5. PING
  * Type:    Extended Query
  * Params:  PING <info>

* A.7. TIME
  * Type:    Extended Query
  * Params:  TIME <timestring>

* A.8. VERSION
  * Type:   Metadata Query
  * Reply:  VERSION <verstring>

* A.9. USERINFO
  * Type:   Metadata Query
  * Reply:  USERINFO <info>


## IRC Message IDs Extention

* https://ircv3.net/specs/extensions/message-ids.html


## Reference IRC message parser tests:

* https://github.com/ircdocs/parser-tests


## IRC Commands

* Once a user has joined a channel, they receive notice about all
  commands their server receives which affect the channel.  This
  includes MODE, KICK, PART, QUIT and of course PRIVMSG/NOTICE.

* Command: JOIN
  Parameters: <channel>{,<channel>} [<key>{,<key>}]

* Command: PART
  Parameters: <channel>{,<channel>}

* Command: MODE
  Channel Modes - Parameters: <channel> {[+|-]|o|p|s|i|t|n|b|v} [<limit>] [<user>] [<ban mask>]
  User Modes - Parameters: <nickname> {[+|-]|i|w|s|o}

* Command: TOPIC
  Parameters: <channel> [<topic>]

* Command: NAMES
  Parameters: [<channel>{,<channel>}]

* Command: LIST
  Parameters: [<channel>{,<channel>} [<server>]]

* Command: KICK
  Parameters: <channel> <user> [<comment>]

* Command: PRIVMSG
  Parameters: <receiver>{,<receiver>} <text to be sent>

* Command: NOTICE
  Parameters: <nickname> <text>

* Command: PING
  Parameters: <server1> [<server2>]


## Twitch IRC Extended Commands

* Supports generic commands - https://dev.twitch.tv/docs/irc/guide#generic-irc-commands
* Adds additional commands - https://dev.twitch.tv/docs/irc/commands

* Command: CLEARCHAT
  Prototype: `:tmi.twitch.tv CLEARCHAT #<channel> :<user>`
  Example: `:tmi.twitch.tv CLEARCHAT #dallas` - clear ALL chat
  Example: `:tmi.twitch.tv CLEARCHAT #dallas :ronni` - clear single user's messages

* Command: CLEARMSG
  Prototype: `@login=<login>;target-msg-id=<target-msg-id> :tmi.twitch.tv CLEARMSG #<channel> :<message>`
  Example: `@login=ronni;target-msg-id=abc-123-def :tmi.twitch.tv CLEARMSG #dallas :HeyGuys`

* Command: HOSTTARGET
  Prototype: `:tmi.twitch.tv HOSTTARGET #hosting_channel :<channel> [<number-of-viewers>]` - starts host
  Prototype: `:tmi.twitch.tv HOSTTARGET #hosting_channel :- [<number-of-viewers>]` - ends host

* Command: NOTICE
  Prototype: `@msg-id=<msg id>:tmi.twitch.tv NOTICE #<channel> :<message>`
  Example: `@msg-id=slow_off :tmi.twitch.tv NOTICE #dallas :This room is no longer in slow mode.`

* Command: RECONNECT - Rejoin channels after a restart.

* Command: ROOMSTATE
  Prototype: `:tmi.twitch.tv ROOMSTATE #<channel>`

* Command: USERNOTICE
  Prototype: `:tmi.twitch.tv USERNOTICE #<channel> :message`

* Command: USERSTATE
  Prototype: `:tmi.twitch.tv USERSTATE #<channel>`
