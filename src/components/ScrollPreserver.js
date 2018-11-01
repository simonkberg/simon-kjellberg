// @flow strict
import * as React from 'react'
import nextTick from '../utils/nextTick'

type Props = {
  children: <T: React.ElementType>(ref: {
    current: null | React.ElementRef<T>,
  }) => React.Node,
}

export default class ScrollPreserver extends React.Component<Props> {
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

  componentDidUpdate(
    prevProps: Props,
    prevState: void,
    snapshot: number | null
  ) {
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
    return this.props.children(this.ref)
  }
}
