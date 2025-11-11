// Type declarations for Deno APIs used in this project
declare namespace Deno {
  interface Stdin {
    read(buffer: Uint8Array): Promise<number | null>;
    setRaw?(mode: boolean): void;
  }

  const stdin: Stdin;
  const pid: number;

  function exit(code?: number): never;
  function listen(options: { port: number }): Listener;
  function writeTextFile(
    path: string,
    data: string,
    options?: { append?: boolean }
  ): Promise<void>;
  function readTextFile(path: string): Promise<string>;

  interface Env {
    has(key: string): boolean;
    get(key: string): string | undefined;
  }

  const env: Env;

  interface NetAddr {
    hostname: string;
    port: number;
  }

  interface Conn {
    rid: number;
    remoteAddr: NetAddr | Deno.UnixAddr;
    read(buffer: Uint8Array): Promise<number | null>;
    close(): void;
  }

  interface UnixAddr {
    path: string;
  }

  interface Listener {
    [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
  }
}
