/* eslint-disable react/prop-types */
import * as React from 'react'
import { ApolloClient } from 'apollo-client'
import { getDataFromTree } from '@apollo/react-ssr'
import { split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import {
  InMemoryCache,
  IntrospectionFragmentMatcher,
  defaultDataIdFromObject,
} from 'apollo-cache-inmemory'
import { getMainDefinition } from 'apollo-utilities'
import fetch from 'cross-fetch'
import getApolloUrls from '../utils/getApolloUrls'
import getFragmentTypes from '../utils/getFragmentTypes'

const dataIdFromObject = result => {
  switch (result.__typename) {
    case 'ChatMessage':
    case 'ChatMessageReply':
      if (result.ts != null) {
        return `${result.__typename}:${result.ts}`
      }

    // fallthrough

    default:
      return defaultDataIdFromObject(result)
  }
}

const createInMemoryCache = fragmentTypes =>
  new InMemoryCache({
    freezeResults: true,
    fragmentMatcher: new IntrospectionFragmentMatcher({
      introspectionQueryResultData: fragmentTypes,
    }),
    dataIdFromObject,
  })

const createHttpLink = (uri, options) =>
  new HttpLink({
    uri,
    fetch,
    ...options,
  })

const createWebSocketLink = (uri, options) =>
  new WebSocketLink({
    uri,
    options: {
      reconnect: true,
      ...options,
    },
  })

const splitSubscriptions = ({ query }) => {
  const { kind, operation } = getMainDefinition(query)
  return kind === 'OperationDefinition' && operation === 'subscription'
}

const createLinks = props => {
  if (!process.browser) {
    return createHttpLink(props.apolloUrls.graphql, {
      headers: {
        cookie: props.cookie,
      },
    })
  }

  const apolloUrls = getApolloUrls()
  return split(
    splitSubscriptions,
    createWebSocketLink(apolloUrls.subscription),
    createHttpLink(apolloUrls.graphql, {
      credentials: 'include',
    })
  )
}

const createClient = props => {
  const link = createLinks(props)
  const cache = createInMemoryCache(props.fragmentTypes)

  if (props.apolloState) {
    cache.restore(props.apolloState)
  }

  return new ApolloClient({
    assumeImmutableResults: true,
    ssrMode: !process.browser,
    // $FlowFixMe
    link,
    cache,
  })
}

export default App =>
  class WithApollo extends React.Component {
    static async getInitialProps(ctx) {
      const appProps =
        App.getInitialProps != null ? await App.getInitialProps(ctx) : {}
      const fragmentTypes = getFragmentTypes(ctx.ctx)
      const apolloUrls = getApolloUrls(ctx.ctx)

      if (!process.browser) {
        const cookie = ctx.ctx.req.headers.cookie
        const apolloClient = createClient({
          apolloUrls,
          fragmentTypes,
          cookie,
        })

        await getDataFromTree(
          <App
            {...appProps}
            Component={ctx.Component}
            router={ctx.router}
            apolloClient={apolloClient}
          />
        )

        const apolloState = apolloClient.extract()

        return {
          ...appProps,
          apolloUrls,
          apolloState,
          fragmentTypes,
          cookie,
        }
      }

      return { ...appProps, apolloUrls, fragmentTypes }
    }

    apolloClient = createClient(this.props)

    render() {
      const {
        cookie,
        fragmentTypes,
        apolloUrls,
        apolloState,
        ...props
      } = this.props

      return <App {...props} apolloClient={this.apolloClient} />
    }
  }
