import { createStore } from 'alt-flux'
import WakaTimeActions from 'actions/WakaTimeActions'
import WakaTimeSource from 'sources/WakaTimeSource'

class WakaTimeStore {
  static displayName = 'WakaTimeStore'

  stats = []
  error = null

  constructor () {
    this.bindListeners({
      handleUpdateStats: WakaTimeActions.UPDATE_STATS,
      handleFetchStats: WakaTimeActions.FETCH_STATS,
      handleStatsFailed: WakaTimeActions.STATS_FAILED
    })

    this.exportAsync(WakaTimeSource)
  }

  handleUpdateStats (stats) {
    this.stats = stats['data']
    this.error = null
  }

  handleFetchStats () {
    this.stats.length = 0
  }

  handleStatsFailed (error) {
    this.error = error
  }
}

export default createStore(WakaTimeStore, WakaTimeStore.displayName)
