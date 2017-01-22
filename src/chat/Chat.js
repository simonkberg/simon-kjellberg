import React, { PureComponent, PropTypes } from 'react'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import withSocket from 'helpers/withSocket'
import withStyles from 'helpers/withStyles'
import log from 'helpers/log'

import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import * as chatActions from './chatActions'
import { getChatLoading } from './chatSelectors'
import Styles from './Chat.css'

const { object, func, bool } = PropTypes

export class Chat extends PureComponent {
  static propTypes = {
    styles: object,
    messages: object,
    users: object,
    loading: bool,
    loadChatHistory: func,
    loadChatUsers: func,
    addChatMessage: func,
    updateChatMessage: func,
    removeChatMessage: func,
    socket: object,
    socketOpen: bool,
  }

  static defaultProps = {
    messages: {},
    users: {},
    loading: false,
  }

  list = null
  wrapper = null
  state = { open: __DEV__ }

  componentDidMount () {
    const { loadChatHistory, loadChatUsers } = this.props

    loadChatHistory()
    loadChatUsers()

    if (this.state.open) {
      this.bindDocumentClick()
    }
  }

  componentWillUnmount () {
    this.unbindDocumentClick()
  }

  openChat = () =>
    this.state.open === false &&
      this.setState({ open: true }, this.bindDocumentClick)

  closeChat = () =>
    this.state.open === true &&
      this.setState({ open: false }, this.unbindDocumentClick)

  toggleChat = () => this.setState(
    state => ({ open: !state.open }),
    () => this.state.open
      ? this.bindDocumentClick()
      : this.unbindDocumentClick()
  )

  bindDocumentClick = () =>
    document.addEventListener('click', this.onDocumentClick, {
      passive: true,
    })

  unbindDocumentClick = () =>
    document.removeEventListener('click', this.onDocumentClick, {
      passive: true,
    })

  onDocumentClick = event => {
    if (
      this.state.open &&
      this.wrapper &&
      event.target !== this.wrapper &&
      !this.wrapper.contains(event.target)
    ) {
      this.closeChat()
    }
  }

  onSocketError = event => {
    log('Socket Error', event)
  }

  onSocketMessage = (event, data) => {
    log('Socket Message', event)

    const {
      removeChatMessage,
      updateChatMessage,
      addChatMessage,
    } = this.props

    const { subtype, ...message } = data

    switch (subtype) {
      case 'message_deleted':
        removeChatMessage(message)
        break
      case 'message_changed':
      case 'message_replied':
        updateChatMessage(message)
        break
      default:
        addChatMessage(message)
    }
  }

  sendMessage = message => {
    const { socket } = this.props

    if (socket) {
      socket.send(message)
    }
  }

  setWrapperRef = el => {
    this.wrapper = el
  }

  render () {
    const { open } = this.state
    const { styles, loading, socketOpen } = this.props

    if (!socketOpen) return null

    const wrapper = {
      className: classNames(styles.wrapper, {
        [styles.isOpen]: !!open,
      }),
      ref: this.setWrapperRef,
    }

    const button = {
      className: classNames(styles.toggle, {
        [styles.toggleOpen]: open === false,
        [styles.toggleClose]: open === true,
      }),
      onClick: this.toggleChat,
    }

    const input = {
      sendMessage: this.sendMessage,
      openChat: this.openChat,
      styles,
    }

    return (
      <div {...wrapper}>
        <button {...button}>
          <span className={styles.toggleText}>
            {open ? 'Close' : 'Open'}
          </span>
        </button>
        <div className={styles.container}>
          {!loading &&
            <ChatMessageList {...this.props} />}
          <ChatInput {...input} />
        </div>
      </div>
    )
  }
}

const WithSocket = withSocket()(Chat)
const WithStyles = withStyles(Styles)(WithSocket)

const mapStateToProps = (state) => ({
  loading: getChatLoading(state),
})

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({...chatActions}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WithStyles)
