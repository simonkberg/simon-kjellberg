import { Map } from 'immutable'

import { SET_BASE_URL } from './appActions'
import reducerMap from 'helpers/reducerMap'

const initialState = Map({ baseUrl: '' })

const app = reducerMap({
  [SET_BASE_URL]: (state, action) => state.set('baseUrl', action.baseUrl)
}, initialState)

export default app
