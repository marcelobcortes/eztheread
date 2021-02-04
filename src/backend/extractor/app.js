'use strict'

const dynamo = require('dynamodb')
const Joi = require('joi')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const iot = new AWS.Iot()

const Word = dynamo.define('Word', {
    hashKey : 'word',
    timestamps : false,
    schema : {
        word        : Joi.string(),
        dictionary  : Joi.array(),
        translation : Joi.array(),
        frequency   : Joi.number(),
        score       : Joi.number(),
    }
})

exports.handler = async (event) => {
    // get file hash
    // verify if we have it cached
    const fileName = event.Records[0].s3.object.key
    const topic = fileName.substring(0, fileName.length-4)
    try {
        const bucket = event.Records[0].s3.bucket.name 
        const file = await getFileFromS3(fileName, bucket)
        
        const wordList = extractWords(file)
        const sortedWordList = await getSortedList(wordList)
        
        const {compress} = require('compress-json')
        const compressed = compress(sortedWordList)

        const splittedPayload = splitPayload(compressed)

        // save hash and sorted list
        try {
            await publishSplittedToIoTTopic(topic, splittedPayload)
        } catch (err) {
            console.error('erro? ')
            console.error(err)
        }
        return sortedWordList
    } catch (error) {
        console.error(error)
        await publishToIoTTopic(topic, error)
    }
}

const publishSplittedToIoTTopic = async (topic, splittedPayload) => {
    await asyncForEach(splittedPayload, async (chunk) => {
        console.log(JSON.stringify(chunk).length)
        await publishToIoTTopic(topic, chunk)
    })
}

const splitPayload = (payload) => {
    const str = JSON.stringify(payload)
    const splittedPayload = []
    // max payload size is 128KB but somehow its size increases slightly after this point
    const chunkMaxSize = 127 * 1024
    // arbitrary value got from observation
    // because inside chunk we have characters that are escaped when stringified (thus it gets bigger),
    // we need to chunk into smaller parts than the 128 KB
    // it's decreased if the chunk is still larger than permitted
    let chunkSize = 117 * 1024

    let chunkOrder = 0
    let chunkOffset = 0

    do {
        const chunk = str.substring(chunkOffset, chunkOffset+chunkSize)
        if (chunk.length === 0) {
            break;
        }
        const payloadChunk = {
            order: ++chunkOrder,
            chunk
        }
        if (JSON.stringify(payloadChunk).length > chunkMaxSize) {
            chunkSize -= 1024
            chunkOrder--
        } else {
            splittedPayload.push(payloadChunk)
            chunkOffset += chunkSize
        }
        
    } while (true);

    splittedPayload.map((value) => {
        value.total = chunkOrder
        return value
    })

    return splittedPayload
}

const publishToIoTTopic = async (topic, payload) => {
    const {endpointAddress} = await iot.describeEndpoint({endpointType: 'iot:Data-ATS'}).promise()
    const iotdata = new AWS.IotData({endpoint: endpointAddress})

    await iotdata.publish({
        topic,
        payload: JSON.stringify(payload),
        qos: 1
    }).promise()
}

const getSortedList = async (wordList) => {
    let sortedWordList = []

    for (const word of wordList) {
        const wordStored = await Word.query(word).exec().promise()
        if (wordStored[0]['Count'] > 0) {
            const wordMetadata = Object.values(wordStored[0].Items).map((value) => value.attrs)
            if (wordMetadata[0]) {
                sortedWordList[wordMetadata[0]['frequency']] = wordMetadata[0]
            }
        }
    }
    return sortedWordList
}

const getFileFromS3 = async (fileName, bucket) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucket, 
            Key: fileName
        }
        const s3 = new AWS.S3()
        s3.getObject(params, function(err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data.Body)
            }
        })
    })
}

const extractWords = (file) => {
    const pdftotext = require('pdftotextjs')
    const fs = require('fs')
    
    fs.writeFileSync('/tmp/tmp.pdf', file)
    const pdf = new pdftotext('/tmp/tmp.pdf')
    const fileContent = pdf.getTextSync().toString()
    return getWordsFromString(fileContent)
}

const correctString = (str) => {
    const correctionExp = [
        {
            exp: '(”$)+',
            correct: (str) => str.substring(0, -2)
        },
        {
            exp: '^(“)+',
            correct: (str) => str.substring(1)
        }]

    correctionExp.forEach((corrExp) => {
        if (str.match(corrExp.exp)) {
            str = corrExp.correct(str)
        }
    })
    return str
}

const getWordsFromString = (string) => {
    const Tokenizer = require('tokenize-text')
    const tokenize = new Tokenizer()
    const wordMatchExp = '([a-z])+'
    
    const tokenizeWords = tokenize.words()(string.toLowerCase())
    let words = {}

    Object.keys(tokenizeWords).forEach((val) => {
        let word = tokenizeWords[val].value
        
        if (word.match(wordMatchExp)) {
            word = correctString(word)
            words[word] = 1
        }
    })
    words = Object.keys(words)

    return words
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        try {
            await callback(array[index], index, array);
        } catch (error) {
            console.error(error)
        }
    }
}