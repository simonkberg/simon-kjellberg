// @flow strict
import * as React from 'react'
import styled from '@emotion/styled'
import { theme } from 'styled-tools'

type Props = {
  level: 1 | 2 | 3 | 4 | 5 | 6,
}

const Component = ({ level, ...props }: Props) => {
  const Tag = `h${level}`

  return <Tag {...props} />
}

const Heading = styled(Component)`
  position: relative;
  margin-top: 1em;
  margin-bottom: 1em;
  margin-left: 1.5ch;
  font-size: 1rem;
  font-weight: bold;

  &::before {
    position: absolute;
    left: -1.5ch;
    content: '>';
    color: ${theme('color.muted')};
  }
`

export default Heading
