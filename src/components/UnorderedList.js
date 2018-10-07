// @flow strict
import styled from 'react-emotion'
import { theme } from 'styled-tools'

export const List = styled('ul')`
  list-style-type: none;
  padding: 0;
  margin-top: 1em;
  margin-bottom: 1em;
  margin-left: 1.5ch;
`

export const ListItem = styled('li')`
  position: relative;

  &::before {
    content: '*';
    position: absolute;
    left: -1.5ch;
    color: ${theme('color.muted')};
  }

  & > ${List} {
    margin-top: 0;
    margin-bottom: 0;
  }
`
