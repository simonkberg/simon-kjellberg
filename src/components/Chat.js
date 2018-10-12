// @flow strict
import * as React from 'react'
import styled from '@emotion/styled'

import Heading from './Heading.bs'
import Terminal from './Terminal'
import ChatHistory from './ChatHistory'
import ChatMessageInput from './ChatMessageInput'

const ChatWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  max-height: inherit;
`

const Chat = () => (
  <section>
    <Heading level="2">Slack</Heading>
    <Terminal>
      <ChatWrapper>
        <ChatHistory />
        <ChatMessageInput />
      </ChatWrapper>
    </Terminal>
  </section>
)

export default Chat
