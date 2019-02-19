// @flow strict
import * as React from 'react'
import renderer from 'react-test-renderer'
import Page from './Page.bs'

test('<Page />', () => {
  const tree = renderer.create(<Page />).toJSON()
  expect(tree).toMatchSnapshot()
})
