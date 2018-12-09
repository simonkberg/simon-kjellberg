// @flow strict
import * as React from 'react'
import { ApolloClient } from 'apollo-client'
import { getDataFromTree } from 'react-apollo'
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

type Props = {
  +cookie?: string,
  +fragmentTypes: Object,
  +apolloState?: Object,
  +apolloUrls: {| +graphql: string, +subscription: string |},
}

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
    fragmentMatcher: new IntrospectionFragmentMatcher({
      introspectionQueryResultData: fragmentTypes,
    }),
    dataIdFromObject,
  })

const createHttpLink = (uri, options) =>
  new HttpLink({ uri, fetch, ...options })

const createWebSocketLink = (uri, options) =>
  new WebSocketLink({ uri, options: { reconnect: true, ...options } })

const splitSubscriptions = ({ query }) => {
  const { kind, operation } = getMainDefinition(query)

  return kind === 'OperationDefinition' && operation === 'subscription'
}

const createLinks = (props: Props) => {
  if (!process.browser) {
    return createHttpLink(props.apolloUrls.graphql, {
      headers: { cookie: props.cookie },
    })
  }

  const apolloUrls = getApolloUrls()

  return split(
    splitSubscriptions,
    createWebSocketLink(apolloUrls.subscription),
    createHttpLink(apolloUrls.graphql, { credentials: 'include' })
  )
}

const createClient = (props: Props) => {
  const link = createLinks(props)
  const cache = createInMemoryCache(props.fragmentTypes)

  if (props.apolloState) {
    cache.restore(props.apolloState)
  }

  return new ApolloClient({
    ssrMode: !process.browser,
    // $FlowFixMe
    link,
    cache,
  })
}

export default (App: $FlowFixMe) =>
  class WithApollo extends React.Component<Props> {
    static async getInitialProps(ctx: $FlowFixMe) {
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

    apolloClient: ApolloClient<*> = createClient(this.props)

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
