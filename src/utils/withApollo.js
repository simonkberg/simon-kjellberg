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

const splitSubscriptions = ({ query }) => {
  const { kind, operation } = getMainDefinition(query)

  return kind === 'OperationDefinition' && operation === 'subscription'
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
        const apolloClient = new ApolloClient({
          ssrMode: true,
          // $FlowFixMe
          link: createHttpLink(apolloUrls.graphql.toString(), {
            headers: { cookie },
          }),
          cache: createInMemoryCache(fragmentTypes),
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

    apolloClient: ApolloClient<*> = this.apolloClient

    constructor(props: Props) {
      super(props)

      const apolloUrls = !process.browser ? props.apolloUrls : getApolloUrls()
      const cache = createInMemoryCache(props.fragmentTypes).restore(
        props.apolloState || {}
      )

      const link = !process.browser
        ? createHttpLink(apolloUrls.graphql, {
            headers: { cookie: props.cookie },
          })
        : split(
            splitSubscriptions,
            new WebSocketLink({
              uri: apolloUrls.subscription,
              options: { reconnect: true },
            }),
            createHttpLink(apolloUrls.graphql, {
              credentials: 'include',
            })
          )

      this.apolloClient = new ApolloClient({
        ssrMode: !process.browser,
        // $FlowFixMe
        link,
        cache,
      })
    }

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
