export default function getFragmentTypes(ctx) {
  return ctx.req != null ? ctx.req.fragmentTypes : window.__FRAGMENT_TYPES__
}
