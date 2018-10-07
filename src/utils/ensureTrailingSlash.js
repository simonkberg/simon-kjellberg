// @flow strict

const ensureTrailingSlash = (uri: string) =>
  uri.charAt(uri.length - 1) === '/' ? uri : `${uri}/`

export default ensureTrailingSlash
