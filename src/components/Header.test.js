import * as React from 'react'
import renderer from 'react-test-renderer'
import Header from './Header.bs'

test('<Header />', () => {
  const tree = renderer.create(<Header siteTitle="Site Title" />).toJSON()
  expect(tree).toMatchSnapshot()
})
