// @flow strict
import * as React from 'react'
import HTTPStatus from 'http-status'
import getConfig from 'next/config'
import styled from '@emotion/styled'

import type { NextContext } from '../types'
import Page from '../components/Page'

const {
  publicRuntimeConfig: { siteTitle },
} = getConfig()

const Title = styled('h1')`
  font-size: 1rem;
  font-weight: bold;
`

const SubTitle = styled('span')`
  font-size: 1rem;
  font-weight: normal;
`

type Props = {
  statusCode: number | null,
}

export default class Error extends React.Component<Props> {
  static getInitialProps({ res, err }: NextContext) {
    return {
      statusCode: res ? res.statusCode : err ? err.statusCode : null,
    }
  }

  render() {
    const { statusCode } = this.props
    const title =
      statusCode === 404
        ? 'This page could not be found'
        : (statusCode && HTTPStatus[statusCode]) ||
          'An unexpected error has occurred'

    return (
      <Page
        siteTitle={`${siteTitle} – ${statusCode || 'Error'}`}
        siteDescription={title}
      >
        <Title>
          {statusCode && `${statusCode} – `}
          <SubTitle>{title}</SubTitle>
        </Title>
      </Page>
    )
  }
}
