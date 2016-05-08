import React, { Component } from 'react'
import getDisplayName from './getDisplayName'

export default function withSocket (opts = {}) {
  return (ComposedComponent) => class WithSocket extends Component {
    static displayName = `WithSocket(${getDisplayName(ComposedComponent)})`;
    static ComposedComponent = ComposedComponent;

    _socket = null
    _component = null

    componentDidMount () {
      const { host } = opts

      this._socket = new WebSocket(`ws://${host || window.location.host}`)
      this._socket.addEventListener('open', this._onSocketOpen)
      this._socket.addEventListener('close', this._onSocketClose)
      this._socket.addEventListener('error', this._onSocketError)
    }

    _onSocketOpen = (event) => {
      this._socket.addEventListener('message', this._onSocketMessage)

      if (this._component && this._component['onSocketOpen']) {
        this._component.onSocketOpen(event, this._socket)
      }
    }

    _onSocketClose = (event) => {
      this._socket.removeEventListener('message', this._onSocketMessage)

      if (this._component && this._component['onSocketClose']) {
        this._component.onSocketClose(event)
      }
    }

    _onSocketError = (event) => {
      if (this._component && this._component['onSocketError']) {
        this._component.onSocketError(event)
      }
    }

    _onSocketMessage = (event) => {
      const data = JSON.parse(event.data)

      if (this._component && this._component['onSocketMessage']) {
        this._component.onSocketMessage(event, data)
      }
    }

    componentWillUnmount () {
      if (this._socket) this._socket.close()
    }

    render () {
      const _ref = (el) => {
        this._component = el
      }

      return <ComposedComponent ref={_ref} {...this.props} />
    }
  }
}
