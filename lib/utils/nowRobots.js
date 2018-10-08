// @flow strict

/*::
import type { Middleware, $Request, $Response, NextFunction } from 'express'

type Request = $Subtype<$Request>
type Response = $Response
*/
module.exports = function nowRobots(
  req /*: Request */,
  res /*: Response */,
  next /*: NextFunction */
) {
  if (process.env.NOW) {
    if (req.hostname === process.env.NOW_URL) {
      res.set('X-Robots-Tag', 'noindex, nofollow')
    }
  }

  return next()
}
