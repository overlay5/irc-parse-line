declare module 'irc-parse-line' {
  interface ParsedIrcEvent {
    verb: string;
    servername: string;
    source: string;
    user: string;
    host: string;
    tags: [string, string|boolean][];
    params: string[];
  }
  export function parseIrcLine(line: string): ParsedIrcEvent;
}
