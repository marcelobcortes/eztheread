'use strict'

const dynamo = require('dynamodb')
const Joi = require('joi')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })

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

const extractWords = () => {
    const pdftotext = require('pdftotextjs')
    
    const pdf = new pdftotext('../../input/cover letter.pdf')
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

const getSortedList = async (wordList) => {
    let promises = []
    let sortedWordList = []
    const returnFields = ['word', 'dictionary', 'score', 'frequency']

    for (const word of wordList) {
        promises.push(Word.query(word).attributes(returnFields).exec().promise()
            .then((wordStored) => {
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

const main = async () => {
    
    console.log('extract')
    const wordList = extractWords()
    console.log('sort')

    // query words in parallel
    const sortedWordList = await getSortedList(wordList)
    console.log(sortedWordList)
    console.log('push')
    const promises = []
    
    Object.values(sortedWordList).forEach((word) => {
        word.hash = 'test'
        const item = new SortedFileWords(word)
        promises.push(item.save())
    })


    // multiply frequency for -1


    await Promise.all(promises)

    // const words = await SortedFileWords.scan()..limit(3).exec().promise()
    // console.log(words[0].Items)
}
main()