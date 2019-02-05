// @flow strict
import * as React from 'react'
import styled from '@emotion/styled'
import { theme } from 'styled-tools'
import compose from 'recompose/compose'
import lifecycle from 'recompose/lifecycle'
import withHandlers from 'recompose/withHandlers'
import { Transition, animated } from 'react-spring'

import subscribeToChatMessageAdded from '../utils/subscribeToChatMessageAdded'
import subscribeToChatMessageEdited from '../utils/subscribeToChatMessageEdited'
import subscribeToChatMessageDeleted from '../utils/subscribeToChatMessageDeleted'
import withChatHistory, {
  type ChatHistoryProps,
} from '../utils/withChatHistory'

import useScrollPreserver from '../hooks/useScrollPreserver'
import * as UnorderedList from './UnorderedList'
import ChatMessage from './ChatMessage'
import Loader from './Loader'

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    z-index: 1;
    left: 0;
    right: 0;
    height: 0.625rem;

    pointer-events: none;
  }

  &::before {
    top: 0;
    background: linear-gradient(
      180deg,
      ${theme('terminal.window.backgroundColor')} 0%,
      transparent 100%
    );
  }
  &::after {
    bottom: 0;
    background: linear-gradient(
      0deg,
      ${theme('terminal.window.backgroundColor')} 0%,
      transparent 100%
    );
  }
`

const Content = styled(UnorderedList.List)`
  margin: 0;
  padding: 0.625rem 0;
  overflow-y: auto;
  overflow-x: hidden;

  ::-webkit-scrollbar {
    width: ${theme('scrollbar.width')};
  }

  ::-webkit-scrollbar-track {
    background: ${theme('scrollbar.track.color')};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme('scrollbar.thumb.color')};
    border-radius: ${theme('scrollbar.thumb.radius')};
  }
`

const AnimatedListItem = UnorderedList.ListItem.withComponent(animated('li'))

const messageKeyMap = message => message.ts

const translateXInterpolation = x => `translateX(${x}%)`

const messageRepliesMap = reply => style => (
  <AnimatedListItem
    key={reply.ts}
    style={{
      opacity: style.opacity,
      transform: style.x.interpolate(translateXInterpolation),
    }}
  >
    <ChatMessage {...reply} />
  </AnimatedListItem>
)

const messageThreadMap = message => style => (
  <AnimatedListItem
    key={message.ts}
    style={{
      opacity: style.opacity,
      transform: style.x.interpolate(translateXInterpolation),
    }}
  >
    <ChatMessage {...message} />
    <UnorderedList.List>
      <Transition
        native
        items={message.replies ?? []}
        keys={messageKeyMap}
        initial={{ opacity: 0, x: 0 }}
        from={{ opacity: 0, x: -100 }}
        enter={{ opacity: 1, x: 0 }}
        leave={{ opacity: 0, x: 100 }}
      >
        {messageRepliesMap}
      </Transition>
    </UnorderedList.List>
  </AnimatedListItem>
)

const ChatHistory = ({ loading, error, data }: ChatHistoryProps) => {
  const ref = useScrollPreserver()

  if (loading) {
    return <Loader />
  }

  if (error) {
    return <p>Chat is temporarily unavailable :(</p>
  }

  return (
    <Wrapper>
      <Content ref={ref}>
        {data != null && data.chat != null && data.chat.history != null && (
          <Transition
            native
            // $FlowFixMe: Type refinement is lost somehow
            items={data.chat.history}
            keys={messageKeyMap}
            initial={{ opacity: 0, x: 0 }}
            from={{ opacity: 0, x: -100 }}
            enter={{ opacity: 1, x: 0 }}
            leave={{ opacity: 0, x: 100 }}
          >
            {messageThreadMap}
          </Transition>
        )}
      </Content>
    </Wrapper>
  )
}

const enhance = compose(
  withChatHistory,
  withHandlers({
    subscribeToChatMessageAdded,
    subscribeToChatMessageEdited,
    subscribeToChatMessageDeleted,
  }),
  lifecycle({
    componentDidMount() {
      this.props.subscribeToChatMessageAdded()
      this.props.subscribeToChatMessageEdited()
      this.props.subscribeToChatMessageDeleted()
    },
  })
)

export default enhance(ChatHistory)
