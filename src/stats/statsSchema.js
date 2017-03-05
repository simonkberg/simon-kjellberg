import { schema } from 'normalizr'

export const STATS_ITEM = new schema.Entity(
  'stats',
  {},
  { idAttribute: 'name' }
)
export const STATS_ITEMS = [STATS_ITEM]
