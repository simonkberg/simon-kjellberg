import { useQuery } from 'react-apollo'

import chatHistoryQuery from '../graphql/WakaTimeStatsQuery.graphql'

const useWakaTimeStats = opts => useQuery(chatHistoryQuery, opts)

export default useWakaTimeStats
