// @flow strict

export type NextContext = {
  req?: http$IncomingMessage & { fragmentTypes: Object },
  res?: http$ServerResponse,
  err: null | (Error & { statusCode?: number }),
  pathname: string,
  query: Object,
  asPath: string,
}
