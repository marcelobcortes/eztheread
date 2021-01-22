'use strict'

const pdftotext = require('pdftotextjs');
const fs = require('fs');
const Tokenizer = require('tokenize-text');
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const s3 = new AWS.S3()

exports.handler = async (event) => {
    return await getUploadURL(event)   
}

const getUploadURL = async function(event) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: event.Records[0].s3.bucket.name, 
            Key: event.Records[0].s3.object.key
        };
        s3.getObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack)
                reject(err)
            } else {
                const file = data.Body;
                fs.writeFileSync('/tmp/tmp.pdf', file);
                const pdf = new pdftotext('/tmp/tmp.pdf');
                const fileContent = pdf.getTextSync().toString();
                const words = getWordsFromString(fileContent)
                console.log(words)
                resolve(words)
            }
        });
    })
}

const wordMatchExp = '([a-z])+';

const correctString = (str) => {
    const correctionExp = [
        {
            exp: '(”$)+',
            correct: (str) => str.substring(0, -2)
        },
        {
            exp: '^(“)+',
            correct: (str) => str.substring(1)
        }];

    correctionExp.forEach((corrExp) => {
        if (str.match(corrExp.exp)) {
            str = corrExp.correct(str);
        }
    });
    return str;
}

const getWordsFromString = (string) => {
    const tokenize = new Tokenizer();
    
    const tokenizeWords = tokenize.words()(string.toLowerCase());
    let words = {};

    Object.keys(tokenizeWords).forEach((val) => {
        let word = tokenizeWords[val].value;
        
        if (word.match(wordMatchExp)) {
            word = correctString(word);
            words[word] = 1;
        }
    });
    words = Object.keys(words);

    return words;
}