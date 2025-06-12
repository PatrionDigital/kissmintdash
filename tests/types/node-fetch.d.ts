// Type definitions for node-fetch
declare module 'node-fetch' {
  export interface RequestInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    redirect?: 'follow' | 'manual' | 'error';
    // Add other properties as needed
  }

  export interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    json(): Promise<any>;
    text(): Promise<string>;
    // Add other methods as needed
  }

  declare function fetch(url: string, init?: RequestInit): Promise<Response>;
  
  export default fetch;
}
