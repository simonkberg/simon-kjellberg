// @flow strict
import * as React from 'react'
import styled, { css, keyframes } from 'react-emotion'

const bounce = keyframes`
  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
`

const Container = styled('div')`
  position: relative;
  display: block;
  margin-bottom: 1rem;
  text-align: left;
`

const point = css`
  display: inline-block;
  width: 1ch;
  height: 1ch;
  margin-right: 0.75ch;
  border-radius: 100%;
  background-color: currentColor;
  will-change: transform;
  animation: ${bounce} 1.4s infinite ease-in-out both;
`

const Point1 = styled('span')`
  ${point};
  animation-delay: -0.32s;
`

const Point2 = styled('span')`
  ${point};
  animation-delay: -0.16s;
`

const Point3 = styled('span')`
  ${point};
  animation-delay: 0;
`

const Loader = () => (
  <Container>
    <Point1 />
    <Point2 />
    <Point3 />
  </Container>
)

export default Loader
