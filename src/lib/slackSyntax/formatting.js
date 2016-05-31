const formats = [
  [/`(.+?)`/g, (match, p1) => `<code>${escapeCode(p1)}</code>`],
  [/\*(.+?)\*/g, '<strong>$1</strong>'],
  [/_(.+?)_/g, '<em>$1</em>'],
  [/~(.+?)~/g, '<s>$1</s>']
]

const escapeCode = (string) => {
  return string.replace(/([:*_~`])/g, (match, p1) => `&#${p1.charCodeAt()};`)
}

export default function formatting (string) {
  return formats.reduce((string, format) => string.replace(...format), string)
}
