import {
  type RequestCookie,
  RequestCookies,
  type ResponseCookie,
  ResponseCookies,
} from "@edge-runtime/cookies";

export type ReadonlyRequestCookies = Omit<
  RequestCookies,
  "set" | "clear" | "delete"
> &
  Pick<ResponseCookies, "set" | "delete">;

export class MockCookies implements ReadonlyRequestCookies {
  #requestCookies: RequestCookies;
  #responseCookies: ResponseCookies;

  constructor(headers: Headers) {
    this.#requestCookies = new RequestCookies(headers);
    this.#responseCookies = new ResponseCookies(headers);
  }

  [Symbol.iterator](): MapIterator<[string, RequestCookie]> {
    return this.#requestCookies[Symbol.iterator]();
  }

  get(...args: [name: string] | [RequestCookie]): RequestCookie | undefined {
    return this.#requestCookies.get(...args);
  }

  getAll(...args: [name: string] | [RequestCookie] | []): RequestCookie[] {
    return this.#requestCookies.getAll(...args);
  }

  has(name: string): boolean {
    return this.#requestCookies.has(name);
  }

  get size(): number {
    return this.#requestCookies.size;
  }

  set(
    ...args:
      | [key: string, value: string, cookie?: Partial<ResponseCookie>]
      | [options: ResponseCookie]
  ): ResponseCookies {
    return this.#responseCookies.set(...args);
  }

  delete(
    ...args:
      | [key: string]
      | [options: Omit<ResponseCookie, "value" | "expires">]
  ): ResponseCookies {
    return this.#responseCookies.delete(...args);
  }
}
