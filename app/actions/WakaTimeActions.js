import { createActions } from 'alt-flux'

class WakaTimeActions {
  fetchStats () { return null }
  updateStats (stats) { return stats }
  statsFailed (error) { return error }
}

export default createActions(WakaTimeActions)
