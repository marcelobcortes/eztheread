'use strict'

const dynamo = require('dynamodb')
const Joi = require('joi')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })

const SortedFileWords = dynamo.define('SortedFileWords', {
    hashKey : 'hash',
    rangeKey: 'frequency',

    timestamps : false,
    schema : {
        hash        : Joi.string(),
        word        : Joi.string(),
        dictionary  : Joi.array(),
        translation : Joi.array(),
        frequency   : Joi.number(),
        score       : Joi.number(),
    }
})

exports.handler = async (event) => {
    const hash = event.pathParameters.hash
    let offset = 0
    const limit = 30

    if (hash.length === 0) {
        throw new Error('No hash specified')
    }

    if (event.queryStringParameters && event.queryStringParameters.offset) {
        offset = parseInt(event.queryStringParameters.offset) || 0
    }

    let query = []
    if (offset === 0) {
        query = await SortedFileWords.query(hash).limit(limit).exec().promise()
    } else {
        query = await SortedFileWords.query(hash).where('frequency').gt(offset).limit(limit).exec().promise()
    }

    if (query[0]['Count'] > 0) {
        return {
            words: Object.values(query[0].Items).map((value) => value.attrs)
        }
    } else {
        return {
            words: []
        }
    }
}