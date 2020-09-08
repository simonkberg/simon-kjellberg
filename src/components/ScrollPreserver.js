import * as React from 'react'
import nextTick from '../utils/nextTick'
export default class ScrollPreserver extends React.Component {
  ref = React.createRef()

  componentDidMount() {
    const el = this.ref.current

    if (el != null) {
      nextTick(() => {
        el.scrollTop = el.scrollHeight
      })
    }
  }

  getSnapshotBeforeUpdate() {
    const el = this.ref.current

    if (el != null) {
      const { scrollTop, scrollHeight, clientHeight } = el

      if (scrollTop < scrollHeight - clientHeight) {
        return scrollHeight - scrollTop
      }
    }

    return null
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const el = this.ref.current

    if (el != null) {
      if (snapshot != null) {
        el.scrollTop = el.scrollHeight - snapshot
      } else {
        nextTick(() => {
          el.scrollTop = el.scrollHeight
        })
      }
    }
  }

  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children(this.ref)
  }
}
