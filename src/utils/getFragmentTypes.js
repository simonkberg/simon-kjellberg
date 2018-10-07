// @flow strict

import type { NextContext } from '../types'

export default function getFragmentTypes(ctx: NextContext) {
  return ctx.req != null ? ctx.req.fragmentTypes : window.__FRAGMENT_TYPES__
}
