import getBaseUrl from './getBaseUrl'

export default function getApolloUrls(ctx) {
  const baseUrl = getBaseUrl(ctx)
  const graphqlUrl = new URL('/graphql', baseUrl)
  const subscriptionUrl = new URL(graphqlUrl.href)

  subscriptionUrl.protocol = baseUrl.protocol === 'https:' ? 'wss' : 'ws'

  return {
    graphql: graphqlUrl.toString(),
    subscription: subscriptionUrl.toString(),
  }
}
