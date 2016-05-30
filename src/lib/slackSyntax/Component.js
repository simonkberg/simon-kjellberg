import { Component, PropTypes } from 'react'
import parser from './parser'

const { string } = PropTypes

export default class SlackMessage extends Component {
  static propTypes = {
    children: string.isRequired,
    component: string
  }

  static defaultProps = {
    component: 'span'
  }

  render () {
    const { children, component } = this.props

    return parser(children, component)
  }
}
