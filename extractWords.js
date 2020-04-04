const pdftotext = require('pdftotextjs');
const fs = require('fs');
let Tokenizer = require('tokenize-text');

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

const getWordsFromPDF = (filepath) => {

    const pdf = new pdftotext(filepath);
    const fileContent = pdf.getTextSync().toString();
    
    return getWordsFromString(fileContent);
}

const getWordsFromTXT = (filepath) => {

    const fileContent = fs.readFileSync(filepath);
    
    return getWordsFromString(fileContent.toString());
}

const getWords = (arg, options = {}) => {
    if (options.fileType == 'pdf') {
        return getWordsFromPDF(arg);
    } else if (options.fileType == 'txt') {
        return getWordsFromTXT(arg);
    } else {
        return getWordsFromString(arg);
    }
}

// const words = getWords('input/atomichabits.pdf', {fileType='pdf'});
// fs.writeFileSync('output/pdf.txt', words);

module.exports = getWords;