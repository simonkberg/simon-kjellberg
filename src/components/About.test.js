// @flow strict
import * as React from 'react'
import renderer from 'react-test-renderer'
import About from './About'

jest.mock('./Heading', () => 'Heading')

test('<About />', () => {
  const tree = renderer.create(<About />).toJSON()
  expect(tree).toMatchSnapshot()
})
