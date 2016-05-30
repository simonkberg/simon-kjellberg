
const transform = (match, p1, p2, p3) => {
  if (p1) {
    return do {
      if (p1 === '!') {
        `@${p3 || p2}`
      } else {
        `${p1}${p3 || p2}`
      }
    }
  }

  return `<a href="${p2}">${p3 || p2}</a>`
}

export default function links (input) {
  return input.replace(/<([!|#|@])?(.+?)(?:\|(.+?))?>/g, transform)
}
