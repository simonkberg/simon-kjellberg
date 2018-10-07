// @flow strict
import * as React from 'react'
import screenfull from 'screenfull'
import styled, { css } from 'react-emotion'
import { theme, withProp } from 'styled-tools'
import { darken } from 'polished'

const Window = styled('div')`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;
  margin-top: 1em;
  margin-bottom: 1em;
  border-radius: 0.625rem;
  background-color: ${theme('terminal.window.backgroundColor')};

  &:fullscreen {
    height: 100%;
    margin: 0;
  }

  &:-ms-fullscreen {
    height: 100%;
    margin: 0;
  }

  &:-moz-full-screen {
    height: 100%;
    margin: 0;
  }

  &:-webkit-full-screen {
    height: 100%;
    margin: 0;
  }
`

const WindowTopbar = styled('div')`
  background-color: ${theme('terminal.topbar.backgroundColor')};
  height: ${theme('terminal.topbar.height')};
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0 0.625rem;
`

const windowControl = css`
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  padding: 0;
  margin: 0.625rem 0.25rem 0 0;
  border-radius: 0.5rem;
  border: 1px solid transparent;

  &:focus {
    outline: none;
  }
`

const WindowControlClose = styled('button')`
  ${windowControl};
  background-color: ${theme('terminal.controls.close.backgroundColor')};

  &:focus {
    border-color: ${withProp(
      'theme.terminal.controls.close.backgroundColor',
      darken(0.15)
    )};
  }
`

const WindowControlMinimize = styled('button')`
  ${windowControl};
  background-color: ${theme('terminal.controls.minimize.backgroundColor')};

  &:focus {
    border-color: ${withProp(
      'theme.terminal.controls.minimize.backgroundColor',
      darken(0.15)
    )};
  }
`

const WindowControlMaximize = styled('button')`
  ${windowControl};
  background-color: ${theme('terminal.controls.maximize.backgroundColor')};

  &:focus {
    border-color: ${withProp(
      'theme.terminal.controls.maximize.backgroundColor',
      darken(0.15)
    )};
  }
`

const WindowContent = styled('div')`
  display: flex;
  flex-direction: column;
  position: relative;
  color: ${theme('terminal.content.color')};
  max-height: ${theme('terminal.content.maxHeight')};
  margin: 0 1.25rem;

  ${Window}:fullscreen & {
    max-height: none;
  }

  ${Window}:-ms-fullscreen & {
    max-height: none;
  }

  ${Window}:-moz-full-screen & {
    max-height: none;
  }

  ${Window}:-webkit-full-screen & {
    max-height: none;
  }
`

type Props = {
  children?: React.Node,
}

const windowRef = React.createRef()

const onClickMaximize = () => {
  if (screenfull.enabled) {
    screenfull.toggle(windowRef.current)
  }
}

const Terminal = ({ children }: Props) => (
  <Window innerRef={windowRef}>
    <WindowTopbar>
      <WindowControlClose />
      <WindowControlMinimize />
      <WindowControlMaximize onClick={onClickMaximize} title="Maximize" />
    </WindowTopbar>
    <WindowContent>{children}</WindowContent>
  </Window>
)

export default Terminal
