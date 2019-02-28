// @flow strict
const UID = Math.floor(Math.random() * 0x10000000000).toString(16)
const escapedChars = new Set()
const escapedTags = new Set()

const escapeChars = (string, char) => {
  const code = char.charCodeAt(0)

  if (!escapedChars.has(code)) {
    escapedChars.add(code)
  }

  const regex = new RegExp(`([${char}])`, 'g')

  return string.replace(regex, `@-${UID}${code}-@`)
}

const unescapeChars = string => {
  if (escapedChars.size > 0) {
    const codes = Array.from(escapedChars.values()).join('|')
    const regex = new RegExp(`@-${UID}(${codes})-@`, 'g')

    escapedChars.clear()

    return string.replace(regex, (match, code) => String.fromCharCode(code))
  }

  return string
}

const escapeTags = (source, ...tags) =>
  tags.reduce((acc, tag) => {
    if (!escapedTags.has(tag)) {
      escapedTags.add(tag)
    }

    const regex = new RegExp(`<(/)?(${tag})>`, 'g')

    return acc.replace(regex, `@--$1${UID}$2--@`)
  }, source)

const unescapeTags = string => {
  if (escapedTags.size > 0) {
    const tags = Array.from(escapedTags.values()).join('|')
    const regex = new RegExp(`@--(/)?${UID}(${tags})--@`, 'g')

    escapedTags.clear()

    return string.replace(regex, '<$1$2>')
  }

  return string
}

const escapeCode = string => {
  return string.replace(/([:*_~`])/gm, (match, p1) => `&#${p1.charCodeAt()};`)
}

// order is important!
const formats = [
  // code blocks
  [
    /[\n]?```([^]+?)```[\n]?/gm,
    (match, code) => {
      return escapeTags(
        `<pre><code>${escapeChars(
          escapeCode(code.replace(/^[\n]?([^]+?)[\n]?$/, '$1')),
          '\n'
        )}</code></pre>`,
        'pre',
        'code'
      )
    },
  ],
  // inline code
  [
    /`(.+?)`/g,
    (match, code) => {
      return escapeTags(`<code>${escapeCode(code)}</code>`, 'code')
    },
  ],
  // links
  [
    /<([!|#|@])?(.+?)(?:\|(.+?))?>/g,
    (match, prefix, link, title) => {
      const content = title || link

      if (prefix) {
        return prefix === '!' ? `@${content}` : `${prefix}${content}`
      }

      return `<a href="${link}" target="_blank" rel="noopener noreferrer">${content}</a>`
    },
  ],
  // bold
  [/\*(.+?)\*/g, '<strong>$1</strong>'],
  // escape emojis
  [/(:[\w\d_\-+]+_[\w\d_\-+]+:)/g, match => escapeChars(match, '_')],
  // italic
  [/_(.+?)_/g, '<em>$1</em>'],
  // strike through
  [/~(.+?)~/g, '<s>$1</s>'],
  // blockquotes (multi line)
  [/[\n]?^&gt;&gt;&gt;([^]+)[\n]?$/gm, '<blockquote>$1</blockquote>'],
  // blockquotes (single line)
  [/[\n]?^&gt;(.+?)[\n]?$/gm, '<blockquote>$1</blockquote>'],
  // line breaks
  [/\n/g, '<br>'],
]

const formatReducer = (string, format) => string.replace(...format)

module.exports = function textParser(string /*: string */) {
  return unescapeChars(unescapeTags(formats.reduce(formatReducer, string)))
}
