import * as React from 'react'
import getConfig from 'next/config'
import styled from '@emotion/styled'

import Page from '../components/Page.bs'

const {
  publicRuntimeConfig: { siteTitle },
} = getConfig()

const statusCodes = {
  400: 'Bad Request',
  404: 'This page could not be found',
  500: 'Internal Server Error',
  501: 'Not Implemented',
}

const Title = styled('h1')`
  font-size: 1rem;
  font-weight: bold;
`

const SubTitle = styled('span')`
  font-size: 1rem;
  font-weight: normal;
`
export default class Error extends React.Component {
  static getInitialProps({ res, err }) {
    return {
      statusCode: res ? res.statusCode : err ? err.statusCode : null,
    }
  }

  render() {
    // eslint-disable-next-line react/prop-types
    const { statusCode } = this.props
    const title =
      (statusCode && statusCodes[statusCode]) ||
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
