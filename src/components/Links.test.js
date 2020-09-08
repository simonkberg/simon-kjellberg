import * as React from 'react'
import renderer from 'react-test-renderer'
import Links from './Links.bs'

test('<Links />', () => {
  const tree = renderer.create(<Links />).toJSON()
  expect(tree).toMatchSnapshot()
})
