// take the data from the metadata file
// upload one by one to the dynamodb
// make sure I can pause the process without losing the progress

const fs = require('fs');
const dynamo = require('dynamodb');
const Joi = require('joi');
dynamo.AWS.config.loadFromPath('../../credentials.json');
dynamo.AWS.config.update({region: "us-east-1"});

const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

const savePartial = () => {
    fs.writeFileSync('../../input/currentId.txt', currentId);
    fs.writeFileSync('../../input/wordsWithMetadata.txt', JSON.stringify(wordsWithMetadata));
};

var Word = dynamo.define('Word', {
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

// await dynamo.createTables(function(err) {
//     if (err) {
//       console.log('Error creating tables: ', err);
//     } else {
//       console.log('Tables has been created');
//     }
// });

const uploadWord = async (word) => {
    return new Promise((resolve, reject) => {
        Word.create(
            {
                word: word[0]['word'].toLowerCase(),
                dictionary: word,
                translation: [],
                frequency: currentId,
                score: 0
            }, function (err, acc) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

let word = '';
let wordProcessed = true;
let wordsWithMetadata = Object.values(JSON.parse(fs.readFileSync('../../input/wordsWithMetadata.txt')));
let currentId = parseInt(fs.readFileSync('../../input/currentId.txt'));

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    if (!wordProcessed) {
        wordsWithMetadata.unshift(word);
    }
    savePartial();
    process.exit();
});

const main = async () => {
    console.log(wordsWithMetadata.length + " words left");
    while (true) {
        if (wordsWithMetadata.length % 100 === 0) {
            console.log(wordsWithMetadata.length + " words left");
        }
        if (wordsWithMetadata[0]) {
            word = wordsWithMetadata.shift();
            wordProcessed = false;
            try {
                await uploadWord(word);
                currentId++;
                wordProcessed = true;
                await sleep(100);
            } catch (e) {
                console.log(e.message);
                console.log(`${word}`);
                wordsWithMetadata.unshift(word);
                wordProcessed = true;
            }

        } else {
            break;
        }
    }
    savePartial();
};
main();