const ensureTrailingSlash = uri =>
  uri.charAt(uri.length - 1) === '/' ? uri : `${uri}/`

export default ensureTrailingSlash
