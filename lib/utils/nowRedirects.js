// @flow strict

/*::
import type { Middleware, $Request, $Response, NextFunction } from 'express'

type Request = $Subtype<$Request>
type Response = $Response
*/

const MAIN_HOSTNAME = 'simonkjellberg.com'
const NOW_HOSTNAME =
  process.env.NOW_URL != null ? process.env.NOW_URL.replace('https://', '') : ''

module.exports = function nowRedirects(
  req /*: Request */,
  res /*: Response */,
  next /*: NextFunction */
) {
  if (process.env.NOW) {
    if (req.hostname !== MAIN_HOSTNAME && req.hostname !== NOW_HOSTNAME) {
      return res.redirect(301, `https://${MAIN_HOSTNAME}${req.originalUrl}`)
    }
  }

  return next()
}
