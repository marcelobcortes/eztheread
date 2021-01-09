const fs = require('fs');
const getDictionary = require('../getDictionary.js');

const jsonString = JSON.stringify(getDictionary());

fs.writeFileSync('../../input/wordsWithoutMetadata.txt', jsonString);