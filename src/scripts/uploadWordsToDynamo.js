// take the words w/ definitions from the wordsWithMetadata.txt
// request its translation to pt-br
// request its score
// insert to dynamodb

const request = require('request')
const fs = require('fs')
const {key1, location} = JSON.parse(fs.readFileSync('../../azure.json'))
const dynamo = require('dynamodb')
const Joi = require('joi')
dynamo.AWS.config.loadFromPath('../../credentials.json')
dynamo.AWS.config.update({region: "us-east-1"})

var Word_scored = dynamo.define('word', {
    hashKey : 'word',
  
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps : true,
  
    schema : {
        word        : Joi.string(),
        dictionary  : Joi.array(),
        translation : Joi.object(),
        frequency   : Joi.number(),
        score       : Joi.number(),
    }
})

var Word = dynamo.define('7Word', {
    tableName: 'eztheread-words',
    hashKey : 'word',
  
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps : true,
  
    schema : {
        word        : Joi.string(),
        dictionary  : Joi.array(),
        translation : Joi.object(),
        frequency   : Joi.number(),
        score       : Joi.number(),
    }
})

const uploadWord = (word, frequency) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                method: 'POST',
                url: 'https://api.cognitive.microsofttranslator.com/dictionary/lookup',
                qs: {
                  'api-version': '3.0',
                  'from': 'en',
                  'to': 'pt-br'
                },
                headers: {
                  'Ocp-Apim-Subscription-Key': key1,
                  'Ocp-Apim-Subscription-Region': location,
                  'Content-type': 'application/json',
                },
                body: [{
                      'text': word[0]['word'].toLowerCase()
                }],
                json: true,
            }

            request(options, function(err, res, translated){
                if (err) {
                    reject(err)
                } else {
                    const translation = translated[0].translations.reduce(
                        (acum, curr) => {
                            if (!acum[curr.posTag]) acum[curr.posTag] = []

                            acum[curr.posTag].push(curr.displayTarget)
                            return acum
                        }, {}
                    )
                    try {
                        Word_scored.query(word[0]['word'].toLowerCase()).exec((err, res) => {
                            let score = 0
                            if (res) {
                                score = Object.values(res.Items).map((value) => value.attrs)[0].score
                            }
                            Word.create(
                                {
                                    word: word[0]['word'].toLowerCase(),
                                    dictionary: word,
                                    frequency,
                                    translation: {"pt-br": translation},
                                    score
                                }, function (err, acc) {
                                if (err) {
                                    console.log(err)
                                    reject(err)
                                } else {
                                    if (insertedCount % 10 === 0) {
                                        console.log(++insertedCount)
                                    }
                                    resolve()
                                }
                            })
                        })
                    } catch (error) {
                        console.log(error)
                        reject(error)
                    }
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

let word = ''
let wordsWithMetadata = Object.values(JSON.parse(fs.readFileSync('../../input/wordsWithMetadata.txt')))
let currentId = 0
let insertedCount = 0

const removeDuplicatedWord = (wordsWithMetadata) => {
    let scannedWords = []

    wordsWithMetadata.forEach((word, index) => {
        if (scannedWords.includes(word[0]['word'].toLowerCase())) {
            wordsWithMetadata[index] = null
        } else {
            scannedWords.push(word[0]['word'].toLowerCase())
        }
    })

    return wordsWithMetadata.filter(v => v != null)
}

const main = async () => {

    try {
    // await dynamo.createTables()
    // return

    let promises = []

    wordsWithMetadata = removeDuplicatedWord(wordsWithMetadata)

    console.log(wordsWithMetadata.length + " words left")
    while (true) {
        if (wordsWithMetadata[0]) {
            word = wordsWithMetadata.shift()
            try {
                promises.push(uploadWord(word, currentId++))
            } catch (e) {
                console.log('error!!')
                console.log(e.message)
                console.log(`${word}`)
                wordsWithMetadata.unshift(word)
            }

        } else {
            break
        }
        if (promises.length >= 100) {
            await Promise.all(promises)
            console.log(wordsWithMetadata.length + " words left")
            promises = []
        }
    }
    await Promise.all(promises)
    } catch (error) {
        console.log(error)
    }
}
main()