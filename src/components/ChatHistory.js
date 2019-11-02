// @flow strict
import * as React from 'react'
import styled from '@emotion/styled'
import { theme } from 'styled-tools'
import { useTransition, animated } from 'react-spring'

import useChatHistory from '../hooks/useChatHistory'

import ScrollPreserver from './ScrollPreserver'
import UnorderedList from './UnorderedList.bs'
import UnorderedListItem from './UnorderedListItem.bs'
import ChatMessage from './ChatMessage.bs'
import Loader from './Loader.bs'

// $FlowFixMe: tagged templates don't support generics
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

const UnorderedListWithRef = React.forwardRef((props, ref) => (
  <UnorderedList {...props} innerRef={ref} />
))

const Content = styled(UnorderedListWithRef)`
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

const AnimatedListItem = animated(UnorderedListItem)

const messageKeyMap = message => message.ts

const translateXInterpolation = x => `translateX(${x}%)`

const ChatHistoryMessageReplies = ({ messages }) => {
  const transitions = useTransition(messages, messageKeyMap, {
    initial: { opacity: 0, x: 0 },
    from: { opacity: 0, x: -100 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: 100 },
  })

  return transitions.map(({ item, key, props }) => (
    <AnimatedListItem
      key={key}
      style={{
        opacity: props.opacity,
        transform: props.x.interpolate(translateXInterpolation),
      }}
    >
      <ChatMessage {...item} />
    </AnimatedListItem>
  ))
}

const ChatHistoryMessageThreads = ({ messages }) => {
  const transitions = useTransition(messages, messageKeyMap, {
    initial: { opacity: 0, x: 0 },
    from: { opacity: 0, x: -100 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: 100 },
  })

  return transitions.map(({ item, key, props }) => (
    <AnimatedListItem
      key={key}
      style={{
        opacity: props.opacity,
        transform: props.x.interpolate(translateXInterpolation),
      }}
    >
      <ChatMessage {...item} />
      <UnorderedList>
        <ChatHistoryMessageReplies messages={item.replies ?? []} />
      </UnorderedList>
    </AnimatedListItem>
  ))
}

const ChatHistory = () => {
  const { loading, error, data } = useChatHistory()

  if (loading) {
    return <Loader />
  }

  if (error) {
    return <p>Chat is temporarily unavailable :(</p>
  }

  return (
    <Wrapper>
      {data != null && data.chat != null && data.chat.history != null && (
        <ScrollPreserver>
          {ref => (
            <Content ref={ref}>
              <ChatHistoryMessageThreads messages={data.chat.history} />
            </Content>
          )}
        </ScrollPreserver>
      )}
    </Wrapper>
  )
}

export default ChatHistory
