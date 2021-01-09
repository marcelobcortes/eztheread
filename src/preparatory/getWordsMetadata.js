const fs = require('fs');
const https = require('https');

const getWordMetadataFromApi = (word) => {
    return new Promise((resolve, reject) => {
        https.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            // Any 2xx status code signals a successful response but
            // here we're only checking for 200.
            if (statusCode !== 200) {
                error = new Error(statusCode);
                        console.error(res.statusMessage);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                                `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                reject(error);
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                    reject(e);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    });
}

const main = async () => {
    let words = Object.values(JSON.parse(fs.readFileSync('../../input/wordsWithoutMetadata.txt')));
    let wordsWithMetadata = Object.values(JSON.parse(fs.readFileSync('../../input/wordsWithMetadata.txt')));

    const savePartial = () => {
        fs.writeFileSync('../../input/wordsWithoutMetadata.txt', JSON.stringify(words));
        fs.writeFileSync('../../input/wordsWithMetadata.txt', JSON.stringify(wordsWithMetadata));
    };
    let word = '';
    let wordProcessed = true;
    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        if (!wordProcessed) {
            words.unshift(word);
        }
        savePartial();
        process.exit();
    });

    while (true) {
        if (words[0]) {
            word = words.shift();
            wordProcessed = false;
            try {
                wordMetadata = await getWordMetadataFromApi(word);
                wordsWithMetadata.push(
                    wordMetadata
                );
                wordProcessed = true;
            } catch (e) {
                console.log(`${word}`);
                if (e.message == 403 | e.message == 429 | e.message == 503) {
                    words.unshift(word);
                    break;
                }
                continue;
            }

        } else {
            break;
        }
    }
    savePartial();
};
main();