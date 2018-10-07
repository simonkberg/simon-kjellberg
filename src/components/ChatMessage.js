// @flow strict
import * as React from 'react'
import styled from 'react-emotion'
import { prop, theme } from 'styled-tools'

const User = styled('span')`
  color: #${prop('color')};
  font-weight: bold;
`

const Message = styled('div')`
  display: inline;

  code {
    padding: 0.1em 0.2em;
    font-size: 0.8em;
    color: ${theme('code.color.inline')};
    background: ${theme('code.background')};
    border: 1px solid ${theme('code.border')};
    vertical-align: text-bottom;
    border-radius: 0.2em;
  }

  pre {
    margin: 0;
    padding: 0.5em;
    margin: 0.5em 0;
    background: ${theme('code.background')};
    border: 1px solid ${theme('code.border')};
    border-radius: 0.2em;
    line-height: 1em;

    > code {
      color: ${theme('code.color.block')};
      padding: 0;
      border: 0;
    }
  }

  blockquote {
    margin: 0;
    padding-left: 1ch;
    border-left: 0.5ch solid ${theme('quote.border')};
  }
`

const EditedLabel = styled('small')`
  color: ${theme('color.muted')};
`

type Props = {
  user: { +name: string, +color: string },
  text: string,
  edited?: boolean | null,
}

const ChatMessage = ({ user, text, edited }: Props) => (
  <>
    <User color={user.color}>{user.name}: </User>
    <Message dangerouslySetInnerHTML={{ __html: text }} />
    {edited && <EditedLabel> (edited) </EditedLabel>}
  </>
)

ChatMessage.defaultProps = {
  edited: false,
}

export default ChatMessage
