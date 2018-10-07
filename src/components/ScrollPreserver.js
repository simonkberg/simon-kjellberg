// @flow strict
import * as React from 'react'

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
      el.scrollTop = el.scrollHeight
    }
  }

  getSnapshotBeforeUpdate() {
    const el = this.ref.current

    if (el != null) {
      return el.scrollHeight - el.scrollTop
    }

    return null
  }

  componentDidUpdate(
    prevProps: Props,
    prevState: void,
    snapshot: number | null
  ) {
    const el = this.ref.current

    if (snapshot != null && el != null) {
      el.scrollTop = el.scrollHeight - snapshot
    }
  }

  render() {
    return this.props.children(this.ref)
  }
}
