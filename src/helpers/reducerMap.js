
import { Map } from 'immutable'

const returnState = state => state

export default function reducerMap (map = {}, initialState = Map()) {
  return (state = initialState, action) =>
    (map[action.type] || returnState)(state, action)
}
