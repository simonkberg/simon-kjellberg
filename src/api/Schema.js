
import { Schema, arrayOf } from 'normalizr'

export const CHAT_MESSAGE = new Schema('messages', { idAttribute: 'ts' })
export const CHAT_MESSAGES = arrayOf(CHAT_MESSAGE)

export const CHAT_USER = new Schema('users')
export const CHAT_USERS = arrayOf(CHAT_USER)
