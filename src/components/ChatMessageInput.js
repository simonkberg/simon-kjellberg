// @flow strict
import * as React from 'react'
import styled from '@emotion/styled'
import { theme } from 'styled-tools'

import usePostChatMessage from '../hooks/usePostChatMessage'
import useNetworkStatus from '../hooks/useNetworkStatus'

// $FlowFixMe: tagged templates don't support generics
const Form = styled('form')`
  flex: 0 0 auto;
`

const InputWrapper = styled('div')`
  position: relative;

  &::before {
    content: '>';
    position: absolute;
    top: calc(50% - (0.625rem / 2)); /* it checks out, I promise */
    transform: translateY(-50%);
    font-weight: bold;
    color: ${theme('color.muted')};
  }
`

const Input = styled('input')`
  position: relative;
  width: 100%;
  padding-left: 1.5ch;
  margin-bottom: 0.625rem;
  background: transparent;
  border: 0;
  border-bottom: 1px solid transparent;
  font: inherit;
  color: inherit;
  transition: border 0.2s ease-out;

  &:focus {
    outline: 0;
    border-bottom-color: ${theme('color.muted')};
  }
`

const ChatMessageInput = () => {
  const [input, setInput] = React.useState('')
  const [postChatMessage] = usePostChatMessage()
  const handleInputChange = React.useCallback(
    event => setInput(event.target.value),
    []
  )
  const handleFormSubmit = React.useCallback(
    event => {
      event.preventDefault()

      const text = input.trim()

      if (text !== '') {
        postChatMessage({ variables: { input: { text } } })
        setInput('')
      }
    },
    [input, postChatMessage]
  )
  const online = useNetworkStatus()

  return (
    <Form onSubmit={handleFormSubmit}>
      <InputWrapper>
        <Input
          value={
            online ? input : 'You appear to be offline. Reconnect to chat 😎💬'
          }
          placeholder="Write a message..."
          onChange={handleInputChange}
          disabled={!online}
        />
      </InputWrapper>
    </Form>
  )
}

export default ChatMessageInput
