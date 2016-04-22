
import Alt from 'alt'

const alt = new Alt()

if (process.env.NODE_ENV !== 'production') {
  Alt.debug('alt', alt)
}

export default alt
export const createActions = alt.createActions.bind(alt)
export const createStore = alt.createStore.bind(alt)
