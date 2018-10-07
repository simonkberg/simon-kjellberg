// @flow strict
import theme from './theme'

test('theme', () => {
  expect(theme).toMatchSnapshot()
})
