import React, { PureComponent, PropTypes } from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { connect } from 'react-redux'

import ChatMessage from './ChatMessage'
import { getChatThreadIds } from './chatSelectors'

const { object, array } = PropTypes

class ChatMessageThread extends PureComponent {
  static propTypes = {
    messageIds: array,
    styles: object,
  }

  render () {
    const { styles, messageIds } = this.props

    const list = {
      component: 'ul',
      className: styles.messageThread,
      transitionAppear: true,
      transitionName: {
        enter: styles.messageEnter,
        enterActive: styles.messageEnterActive,
        leave: styles.messageLeave,
        leaveActive: styles.messageLeaveActive,
        appear: styles.messageAppear,
        appearActive: styles.messageAppearActive,
      },
      transitionAppearTimeout: 500,
      transitionEnterTimeout: 500,
      transitionLeaveTimeout: 500,
    }

    return (
      <ReactCSSTransitionGroup {...list}>
        {messageIds.map(id => <ChatMessage key={id} id={id} styles={styles} />)}
      </ReactCSSTransitionGroup>
    )
  }
}

const mapStateToProps = (state, { id }) => ({
  messageIds: getChatThreadIds(state, id),
})

export default connect(mapStateToProps, null, null, { withRef: true })(
  ChatMessageThread
)
