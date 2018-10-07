// @flow strict
import * as React from 'react'
import styled from 'react-emotion'
import { theme } from 'styled-tools'
import compose from 'recompose/compose'
import withState from 'recompose/withState'
import withHandlers from 'recompose/withHandlers'

import withPostChatMessage, {
  type PostChatMessageProps,
} from '../utils/withPostChatMessage'
import { NetworkStatusConsumer } from './NetworkStatus'

type Props = {
  input: string,
  setInput: (input: string) => void,
  onInputChange: <T>(event: SyntheticEvent<T>) => void,
  onSubmit: <T>(event: SyntheticEvent<T>) => void,
  ...$Exact<PostChatMessageProps>,
}

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

const ChatMessageInput = ({ input, onInputChange, onSubmit }: Props) => (
  <Form onSubmit={onSubmit}>
    <InputWrapper>
      <NetworkStatusConsumer>
        {online => (
          <Input
            value={
              online
                ? input
                : 'You appear to be offline. Reconnect to chat 😎💬'
            }
            onChange={onInputChange}
            disabled={!online}
          />
        )}
      </NetworkStatusConsumer>
    </InputWrapper>
  </Form>
)

const enhance = compose(
  withPostChatMessage,
  withState('input', 'setInput', ''),
  withHandlers({
    onInputChange: ({ setInput }) => event => setInput(event.target.value),
    onSubmit: ({ input, setInput, postChatMessage }) => event => {
      event.preventDefault()

      const text = input.trim()

      if (text !== '') {
        postChatMessage({ variables: { input: { text } } })
        setInput('')
      }
    },
  })
)

export default enhance(ChatMessageInput)
