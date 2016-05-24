
export function appleTouchIcons (sizes = [152], precomposed = true) {
  return sizes.map((size) => {
    return {
      rel: `apple-touch-icon${precomposed ? '-precomposed' : ''}`,
      sizes: `${size}x${size}`,
      href: `/apple-touch-icon-${size}x${size}.png`
    }
  })
}

export default function favicons (sizes = [16, 32]) {
  return sizes.map((size) => {
    return {
      rel: 'icon',
      type: 'image/png',
      sizes: `${size}x${size}`,
      href: `/favicon-${size}x${size}.png`
    }
  })
}
