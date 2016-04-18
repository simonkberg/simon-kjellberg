import WakaTimeActions from 'actions/WakaTimeActions'
import AppStore from 'stores/AppStore'

const WakaTimeSource = {
  fetchStats: {
    remote () {
      const { baseUrl } = AppStore.getState()

      return fetch(`${baseUrl}/api/waka-time/stats`)
        .then((res) => res.json())
    },

    local (state) {
      return state.stats.length || null
    },

    success: WakaTimeActions.updateStats,
    error: WakaTimeActions.statsFailed,
    loading: WakaTimeActions.fetchStats
  }
}

export default WakaTimeSource
