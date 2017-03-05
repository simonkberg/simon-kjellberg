import { createSelector } from 'reselect'
import memoize from './memoize'

const createArgumentedSelector = (...funcs) => {
  let recomputations = 0

  const memoizedFn = memoize(props => {
    const selector = createSelector(...funcs)

    recomputations++

    return (state, ...args) => selector(state, props, ...args)
  })

  const wrappedSelector = (state, props, ...args) =>
    memoizedFn(props)(state, ...args)

  wrappedSelector.recomputations = () => recomputations
  wrappedSelector.resetRecomputations = () => {
    recomputations = 0
  }

  return wrappedSelector
}

export default createArgumentedSelector
