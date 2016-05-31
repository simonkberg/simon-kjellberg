// order is important!
const formats = [
  // links
  [/<([!|#|@])?(.+?)(?:\|(.+?))?>/g, (match, prefix, link, title) => {
    title = title || link

    if (prefix) {
      return prefix === '!'
      ? `@${title}`
      : `${prefix}${title}`
    }

    return `<a href="${link}">${title}</a>`
  }],
  // code
  [/`(.+?)`/g, (match, code) => `<code>${escapeCode(code)}</code>`],
  // bold
  [/\*(.+?)\*/g, '<strong>$1</strong>'],
  // italic
  [/_(.+?)_/g, '<em>$1</em>'],
  // strikethrough
  [/~(.+?)~/g, '<s>$1</s>']
]

const escapeCode = (string) => {
  return string.replace(/([:*_~`])/g, (match, p1) => `&#${p1.charCodeAt()};`)
}

export default function textParser (string) {
  return formats.reduce((string, format) => string.replace(...format), string)
}
