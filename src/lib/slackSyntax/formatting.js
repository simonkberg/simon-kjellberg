const formats = [
  [/\*(.+?)\*/, '<strong>$1</strong>'],
  [/_(.+?)_/, '<em>$1</em>'],
  [/~(.+?)~/, '<s>$1</s>'],
  [/`(.+?)`/, '<code>$1</code>']
]

export default function formatting (string) {
  return formats.reduce((string, format) => string.replace(...format), string)
}
