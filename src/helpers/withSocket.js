import React, { Component } from 'react'
import getDisplayName from './getDisplayName'

export default function withSocket (opts = {}) {
  return ComposedComponent => class WithSocket extends Component {
    static displayName = `WithSocket(${getDisplayName(ComposedComponent)})`
    static ComposedComponent = ComposedComponent

    state = {
      socket: null,
      socketOpen: false,
      socketError: null,
    }

    socket = null
    component = null

    componentDidMount () {
      const {
        host = window.location.host,
        protocol = window.location.protocol === 'https:' ? 'wss' : 'ws',
      } = opts

      this.socket = new WebSocket(`${protocol}://${host}`)
      this.socket.addEventListener('open', this.onSocketOpen)
      this.socket.addEventListener('close', this.onSocketClose)
      this.socket.addEventListener('error', this.onSocketError)

      this.setState({ socket: this.socket })
    }

    onSocketOpen = event => {
      this.socket.addEventListener('message', this.onSocketMessage)

      this.setState({ socketOpen: true }, () => {
        if (this.component && this.component['onSocketOpen']) {
          this.component.onSocketOpen(event, this.socket)
        }
      })
    }

    onSocketClose = event => {
      this.socket.removeEventListener('message', this.onSocketMessage)

      this.setState({ socketOpen: false }, () => {
        if (this.component && this.component['onSocketClose']) {
          this.component.onSocketClose(event)
        }
      })
    }

    onSocketError = event => {
      this.setState({ socketError: event }, () => {
        if (this.component && this.component['onSocketError']) {
          this.component.onSocketError(event)
        }
      })
    }

    onSocketMessage = event => {
      const data = JSON.parse(event.data)

      if (this.component && this.component['onSocketMessage']) {
        this.component.onSocketMessage(event, data)
      }
    }

    componentWillUnmount () {
      if (this.socket) this.socket.close()
    }

    ref = el => {
      this.component = el
    }

    render () {
      const props = {
        ref: this.ref,
        ...this.props,
        ...this.state,
      }

      return <ComposedComponent {...props} />
    }
  }
}
