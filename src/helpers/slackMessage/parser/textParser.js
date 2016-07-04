const UID = Math.floor(Math.random() * 0x10000000000).toString(16)
const escapedChars = new Set()
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
  // escape emojis
  [/(:[\w\d_\-\+]+_[\w\d_\-\+]+:)/g, match => escapeChars(match, '_')],
  // italic
  [/_(.+?)_/g, '<em>$1</em>'],
  // unescape emojis
  // strikethrough
  [/~(.+?)~/g, '<s>$1</s>'],
]

const escapeChars = (string, char) => {
  const code = char.charCodeAt()

  if (!escapedChars.has(code)) {
    escapedChars.add(code)
  }

  const regex = new RegExp(`([${char}])`, 'g')

  return string.replace(regex, `@-${UID}${code}-@`)
}

const unescapeChars = string => {
  if (escapedChars.size > 0) {
    const codes = [...escapedChars.values()].join('|')
    const regex = new RegExp(`@-${UID}(${codes})-@`, 'g')

    string = string.replace(regex, (match, code) => String.fromCharCode(code))

    escapedChars.clear()
  }

  return string
}

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

const replace = (string, format) => string.replace(...format)

export default function textParser (string) {
  return unescapeChars(unescapeTags(formats.reduce(replace, string)))
}
