const UID = Math.floor(Math.random() * 0x10000000000).toString(16)
const escapedTags = new Set()

// order is important!
const formats = [
  // code
  [/`(.+?)`/g, (match, code) => {
    return escapeTags(`<code>${escapeCode(code)}</code>`, 'code')
  }],
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
  // bold
  [/\*(.+?)\*/g, '<strong>$1</strong>'],
  // italic
  [/_(.+?)_/g, '<em>$1</em>'],
  // strikethrough
  [/~(.+?)~/g, '<s>$1</s>']
]

const escapeTags = (string, tag) => {
  if (!escapedTags.has(tag)) {
    escapedTags.add(tag)
  }

  const regex = new RegExp(`<(\/)?(${tag})>`, 'g')

  return string.replace(regex, `@--$1${UID}$2--@`)
}

const unescapeTags = (string) => {
  if (escapedTags.size > 0) {
    const tags = [...escapedTags.values()].join('|')
    const regex = new RegExp(`@--(\/)?${UID}(${tags})--@`, 'g')

    string = string.replace(regex, '<$1$2>')

    escapedTags.clear()
  }

  return string
}

const escapeCode = (string) => {
  return string.replace(/([:*_~`])/g, (match, p1) => `&#${p1.charCodeAt()};`)
}

export default function textParser (string) {
  return unescapeTags(
    formats.reduce((string, format) => string.replace(...format), string)
  )
}
