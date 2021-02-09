'use strict'

const dynamo = require('dynamodb')
const Joi = require('joi')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const iot = new AWS.Iot()
const fs = require('fs');

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
    const filePath = '/tmp/tmp.pdf'

    const bucket = event.Records[0].s3.bucket.name
    const fileName = event.Records[0].s3.object.key
    const topic = fileName.substring(0, fileName.length-4)

    const fileContent = await getFileFromS3(fileName, bucket)
    const checksum = await getChecksum(fileContent)
    const listExists = await sortedWordListExists(checksum)

    if (!listExists) {
        try {
            createTmpFile(filePath, fileContent)
            const wordList = extractWords(filePath)
            const sortedWordList = await transformInSortedList(wordList)

            await saveSortedWordList(checksum, sortedWordList)
        } catch (error) {
            console.error(error)
            await publishToIoTTopic(topic, {error})
        }
    }
    const words = await retrieveSortedWordList(checksum)
    await publishToIoTTopic(topic, {
        hash: checksum,
        words
    })
}

const retrieveSortedWordList = async (hash) => {
    const limit = 30
    const query = await SortedFileWords.query(hash).limit(limit).exec().promise()

    return query[0]['Count'] > 0 ?
        Object.values(query[0].Items).map((value) => value.attrs) :
        []
}

const saveSortedWordList = (checksum, sortedWordList) => {
    const promises = []
    
    Object.values(sortedWordList).forEach((word) => {
        word.hash = checksum
        word.frequency = word.frequency*-1
        const item = new SortedFileWords(word)
        promises.push(item.save())
    })

    return Promise.all(promises)
}

const publishToIoTTopic = async (topic, payload) => {
    try {
        const {endpointAddress} = await iot.describeEndpoint({endpointType: 'iot:Data-ATS'}).promise()
        const iotdata = new AWS.IotData({endpoint: endpointAddress})
    
        await iotdata.publish({
            topic,
            payload: JSON.stringify(payload),
            qos: 1
        }).promise()
    } catch (error) {
        console.error(error)
    }
}

const sortedWordListExists = async (hash) => {
    const items = (await SortedFileWords.query(hash).limit(1).exec().promise())[0].Items
    if (items.length === 0) {
        return false
    }
    return true
}

const transformInSortedList = async (wordList) => {
    let promises = []
    let sortedWordList = []
    const returnFields = ['word', 'dictionary', 'score', 'frequency']

    for (const word of wordList) {
        promises.push(
            Word.query(word).attributes(returnFields).exec().promise().then((wordStored) => {
                if (wordStored[0]['Count'] > 0) {
                    const wordMetadata = Object.values(wordStored[0].Items).map((value) => value.attrs)
                    if (wordMetadata[0]) {
                        sortedWordList[wordMetadata[0]['frequency']] = wordMetadata[0]
                    }
                }
            })
        )
    }
    await Promise.all(promises)
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

const getChecksum = (content) => {
    const crypto = require('crypto')
    const hash = crypto.createHash('md5');
    hash.update(content);
    return hash.digest('hex')
}

const createTmpFile = (filePath, content) => {
    fs.writeFileSync(filePath, content)
}

const extractWords = (filePath) => {
    const pdftotext = require('pdftotextjs')
    
    const pdf = new pdftotext(filePath)
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
            if (word.length > 0) {
                words[word] = 1
            }
        }
    })
    words = Object.keys(words)

    return words
}