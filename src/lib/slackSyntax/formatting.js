const formats = [
  [/\*(.+?)\*/g, '<strong>$1</strong>'],
  [/_(.+?)_/g, '<em>$1</em>'],
  [/~(.+?)~/g, '<s>$1</s>'],
  [/`(.+?)`/g, '<code>$1</code>']
]

export default function formatting (string) {
  return formats.reduce((string, format) => string.replace(...format), string)
}
