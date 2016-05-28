import { createSelector } from 'reselect'

const getBaseUrlState = state => state.getIn(['app', 'baseUrl'])

export const getBaseUrl = createSelector(getBaseUrlState, baseUrl => baseUrl)
