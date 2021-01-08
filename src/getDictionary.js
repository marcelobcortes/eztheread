const getWords = require('./extractWords.js')

const getDictionary = () => {
    return getWords('./input/en_50k.txt', {fileType:'txt'});
}

module.exports = getDictionary;