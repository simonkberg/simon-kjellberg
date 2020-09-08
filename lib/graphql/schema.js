'use strict'

const fs = require('fs')
const path = require('path')
const { makeExecutableSchema, gql } = require('apollo-server-express')
const resolvers = require('./resolvers')
const schema = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')

module.exports = makeExecutableSchema({
  typeDefs: gql(schema),
  resolvers,
})
