export default function getBaseUrl(ctx) {
  if (ctx != null && ctx.req != null) {
    const { address, family, port } = ctx.req.socket.address()

    return new URL(
      family === 'IPv6'
        ? `http://[${address}]:${port}`
        : `http://${address}:${port}`
    )
  }

  return new URL(window.location.origin)
}
