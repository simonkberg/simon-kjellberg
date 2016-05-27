
import { Schema, arrayOf } from 'normalizr'

export const STATS_ITEM = new Schema('stats', { idAttribute: 'name' })
export const STATS_ITEMS = arrayOf(STATS_ITEM)

export const CHAT_MESSAGE = new Schema('messages', { idAttribute: 'ts' })
export const CHAT_MESSAGES = arrayOf(CHAT_MESSAGE)

export const CHAT_USER = new Schema('users')
export const CHAT_USERS = arrayOf(CHAT_USER)
