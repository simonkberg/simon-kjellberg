// @flow strict
import * as React from 'react'
import renderer from 'react-test-renderer'
import * as UnorderedList from './UnorderedList'

test('UnorderedList', () => {
  const tree = renderer
    .create(
      <UnorderedList.List>
        <UnorderedList.ListItem>Foo</UnorderedList.ListItem>
        <UnorderedList.ListItem>Bar</UnorderedList.ListItem>
        <UnorderedList.ListItem>
          <UnorderedList.List>
            Baz
            <UnorderedList.ListItem>Qux</UnorderedList.ListItem>
            <UnorderedList.ListItem>Quux</UnorderedList.ListItem>
          </UnorderedList.List>
        </UnorderedList.ListItem>
      </UnorderedList.List>
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
