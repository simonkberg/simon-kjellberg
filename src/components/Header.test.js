// @flow strict
import * as React from 'react'
import renderer from 'react-test-renderer'
import Header from './Header'

test('<Header />', () => {
  const tree = renderer.create(<Header siteTitle="Site Title" />).toJSON()
  expect(tree).toMatchSnapshot()
})
