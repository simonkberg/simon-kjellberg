import * as React from 'react'
import renderer from 'react-test-renderer'
import UnorderedList from './UnorderedList.bs'
import UnorderedListItem from './UnorderedListItem.bs'

test('UnorderedList', () => {
  const tree = renderer
    .create(
      <UnorderedList>
        <UnorderedListItem>Foo</UnorderedListItem>
        <UnorderedListItem>Bar</UnorderedListItem>
        <UnorderedListItem>
          <UnorderedList>
            Baz
            <UnorderedListItem>Qux</UnorderedListItem>
            <UnorderedListItem>Quux</UnorderedListItem>
          </UnorderedList>
        </UnorderedListItem>
      </UnorderedList>
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
