const pdftotext = require('pdftotextjs');
const pdf = new pdftotext('input/atomichabits.pdf');
pdf.add_options([`-f 1`, `-l 10`]);
const fileContent = pdf.getTextSync().toString();

var Tokenizer = require('tokenize-text');
var tokenize = new Tokenizer();

let tokenizeWords = tokenize.words()(fileContent);
let words = {};
Object.keys(tokenizeWords).forEach((val) => {
    words[tokenizeWords[val].value] = 1;
});
words = Object.keys(words);

console.log(words);