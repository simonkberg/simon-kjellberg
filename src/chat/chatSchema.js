import { schema } from 'normalizr'

export const CHAT_MESSAGE = new schema.Entity('messages', {}, { idAttribute: 'ts' })
export const CHAT_MESSAGES = [CHAT_MESSAGE]

export const CHAT_USER = new schema.Entity('users')
export const CHAT_USERS = [CHAT_USER]
