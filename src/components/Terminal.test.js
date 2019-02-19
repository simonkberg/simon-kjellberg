import * as React from 'react'
import renderer from 'react-test-renderer'
import Terminal from './Terminal.bs'

test('<Terminal />', () => {
  const tree = renderer.create(<Terminal>Hello world!</Terminal>).toJSON()
  expect(tree).toMatchSnapshot()
})
