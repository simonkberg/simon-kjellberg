import { createSelector } from 'reselect'

const getStatsIdsState = state => state.getIn(['stats', 'ids'])

export const getStatsIds = createSelector(
  getStatsIdsState,
  stats => stats.toArray()
)

const getStatsEntitiesState = state => state.getIn(['stats', 'entities'])

export const getStatsEntities = createSelector(
  getStatsEntitiesState,
  entities => entities.toJS()
)

const getStatsEntityState = (state, { id }) => state.getIn(['stats', 'entities', id])

export const makeGetStatsEntity = () => {
  return createSelector(
    getStatsEntityState,
    entity => entity.toObject()
  )
}
