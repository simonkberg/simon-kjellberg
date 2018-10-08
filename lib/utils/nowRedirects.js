// @flow strict

/*::
import type { Middleware, $Request, $Response, NextFunction } from 'express'

type Request = $Subtype<$Request>
type Response = $Response
*/

const hostname = 'simonkjellberg.com'
const aliases = [
  'www.simonkjellberg.com',
  'simonkjellberg.se',
  'www.simonkjellberg.se',
]

module.exports = function nowRedirects(
  req /*: Request */,
  res /*: Response */,
  next /*: NextFunction */
) {
  if (process.env.NOW) {
    if (aliases.includes(req.hostname)) {
      return res.redirect(301, `https://${hostname}${req.originalUrl}`)
    }
  }

  return next()
}
