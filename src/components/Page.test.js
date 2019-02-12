// @flow strict
import * as React from 'react'
import renderer from 'react-test-renderer'
import Page from './Page'

jest.mock('sanitize.css', () => '/* sanitize.css */')
jest.mock('./Header.bs', () => 'Header')

test('<Page />', () => {
  const tree = renderer.create(<Page />).toJSON()
  expect(tree).toMatchSnapshot()
})
