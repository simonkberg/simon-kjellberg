import { createSelector as cs } from 'reselect'

const getBaseUrlState = state => state.getIn(['app', 'baseUrl'])

export const getBaseUrl = cs(getBaseUrlState, baseUrl => baseUrl)
