import emojiData from './emojiData'
import emojiParser from './emojiParser'

const skinMap = {
  '1f3fb': 'skin-tone-2',
  '1f3fc': 'skin-tone-3',
  '1f3fd': 'skin-tone-4',
  '1f3fe': 'skin-tone-5',
  '1f3ff': 'skin-tone-6',
}

test('emojiParser', () => {
  const string = Array.from(emojiData.data.entries()).reduce(
    (acc, [name, emoji]) => {
      const result = `${acc}:${name}:\n`

      return emoji.skins != null
        ? Array.from(emoji.skins.keys()).reduce((innerAcc, key) => {
            return `${innerAcc}:${name}::${skinMap[key]}:\n`
          }, result)
        : result
    },
    ''
  )

  expect(emojiParser(string)).toMatchSnapshot()
})
