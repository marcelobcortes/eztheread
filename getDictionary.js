const fs = require('fs');
const getWords = require('./extractWords.js')

const getDictionary = (filepath) => {
    return getWords(filepath, {fileType:'txt'});
}

const rankWordsByFrequency = (dictionary, words) => {
    let rankedWords = [];
    let count = 0;

    Object.keys(dictionary).forEach((dictKey) => {
        if (dictKey%1000 == 0) {
            console.log(((count++ * 1000)/500) + "% das palavras processadas.");
        }
        Object.keys(words).forEach((fileKey) => {
            if (words[fileKey] == dictionary[dictKey]) {
                rankedWords[dictKey] = dictionary[dictKey];
            }
        });
    });

    return rankedWords;
}

// https://github.com/hermitdave/FrequencyWords/blob/master/content/2018/en/en_50k.txt
const dictionary = getDictionary('input/en_50k.txt');
const words = getWords('input/atomichabits.pdf', {fileType:'pdf'});

const rankedWords = rankWordsByFrequency(dictionary, words);

fs.writeFileSync('output/rank.txt', rankedWords);