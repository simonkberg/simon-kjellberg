'use strict'

const { validateSchema, validate, execute } = require('graphql')
const gql = require('graphql-tag').default

const cache = new WeakMap()

const graphql = async (schema, document) => {
  const schemaValidationErrors = validateSchema(schema)

  if (schemaValidationErrors.length > 0) {
    throw schemaValidationErrors[0]
  }

  const validationErrors = validate(schema, document)

  if (validationErrors.length > 0) {
    throw validationErrors[0]
  }

  // eslint-disable-next-line no-return-await
  return await execute(schema, document)
}

const introspectionQuery = gql`
  query {
    __schema {
      types {
        kind
        name
        possibleTypes {
          name
        }
      }
    }
  }
`

const getFragmentTypes = async schema => {
  let result = cache.get(schema)

  if (result == null) {
    const { data, errors } = await graphql(schema, introspectionQuery)

    if (errors) {
      throw errors[0]
    }

    result = {
      ...data,
      __schema: {
        ...data.__schema,
        types: data.__schema.types.filter(type => type.possibleTypes !== null),
      },
    }

    cache.set(schema, result)
  }

  return result
}

module.exports = getFragmentTypes
