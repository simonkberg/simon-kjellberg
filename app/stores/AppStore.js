import { createStore } from 'alt-flux'
import AppActions from 'actions/AppActions'

class AppStore {
  static displayName = 'AppStore'

  baseUrl = ''

  constructor () {
    this.bindListeners({
      handleUpdateBaseUrl: AppActions.UPDATE_BASE_URL
    })
  }

  handleUpdateBaseUrl (baseUrl) {
    this.baseUrl = baseUrl
  }
}

export default createStore(AppStore, AppStore.displayName)
