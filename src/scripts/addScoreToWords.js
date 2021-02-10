const fs = require('fs');
const request = require('request');
const dynamo = require('dynamodb');
const Joi = require('joi');
dynamo.AWS.config.loadFromPath('../../credentials.json');
dynamo.AWS.config.update({region: "us-east-1"});

const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        try {
            
            await callback(array[index], index, array);
        } catch (error) {
            console.log('erro aqi')
        }
    }
}

let startKey = '';
let processedCount = 0;
let Word = dynamo.define('Word', {
    hashKey : 'word',
  
    // add the timestamp attributes (updatedAt, createdAt)
    timestamps : true,
  
    schema : {
        word        : Joi.string(),
        dictionary  : Joi.array(),
        translation : Joi.array(),
        frequency   : Joi.number(),
        score       : Joi.number(),
    }
});

const getWordScoreInformation = async (word) => {
    return new Promise((resolve, reject) => {
        try {
            const options = {
                method: 'GET',
                url: `https://api.twinword.com/api/score/word/latest/`,
                qs: {entry: word},
                headers: {
                    'X-Twaip-Key': 'XJwS8ll9rUoIvqOjpwJcuh2c9GaUMTC9L594J3IrY8nCubK2NrcMCCu1UHc7bR8gOWHJJ4bgLarnCmYAE9oEaA==',
                    useQueryString: true
                }
            };
            request(options, function (error, response, body) {
                if (response.statusCode !== 200) {
                    console.log(body)
                    reject(response.statusCode)
                }
                try {
                    body = JSON.parse(body);                    
                } catch (err) {
                    console.log(body)
                    reject()
                }
                if (error) reject(error)
                if (!body.ten_degree) reject()
                resolve(body)
            });
  
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
};

const saveProgress = () => {
    fs.writeFileSync('../../input/startKey.txt', startKey);
    fs.writeFileSync('../../input/processedCount.txt', processedCount);
    process.exit();
}

process.on('SIGINT', saveProgress);
process.on('SIGTERM', saveProgress);
// process.on('SIGSTOP', saveProgress);
// process.on('SIGKILL', saveProgress);

const main = async () => {
    startKey = fs.readFileSync('../../input/startKey.txt').toString();
    processedCount = parseInt(fs.readFileSync('../../input/processedCount.txt'));

    let words = [];
    while (true) {
        console.log(startKey)
        words = await Word.scan().where('score').equals(0).loadAll().exec().promise();
        words = Object.values(words[0].Items).map((value) => value.attrs.word);
        console.log(words.length);

        await asyncForEach(words, async (word) => {
            if (++processedCount % 10 === 0) {
                console.log(processedCount);
            }
            try {
                await sleep(100);
                const score = await getWordScoreInformation(word);
                await Word.update({
                    word: word,
                    score: score.ten_degree
                }, (err, acc) => {
                    if (err) throw new Error(err)
                });
            } catch (error) {
                // console.log(error)
            }
            startKey = word;
        });
    }
};

main();