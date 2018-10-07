import * as React from 'react'
import renderer from 'react-test-renderer'
import Loader from './Loader'

test('<Loader />', () => {
  const tree = renderer.create(<Loader />).toJSON()
  expect(tree).toMatchSnapshot()
})
