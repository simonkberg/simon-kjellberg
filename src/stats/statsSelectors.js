import { createSelector as cs } from 'reselect'
import cas from 'helpers/createArgumentedSelector'

const getStatsIdsState = state => state.getIn(['stats', 'ids'])

export const getStatsIds = cs(getStatsIdsState, stats => stats.toArray())

const getStatsState = state => state.getIn(['stats', 'entities'])

export const getStats = cs(getStatsState, entities => entities.toJS())

export const getSortedStatsIds = cs(getStatsIds, getStats, (ids, entities) =>
  ids.sort((a, b) => entities[b].percent - entities[a].percent)
)

const getStatsItemState = (state, { id }) =>
  state.getIn(['stats', 'entities', id])

export const getStatsItem = cas(getStatsItemState, entity => entity.toObject())
