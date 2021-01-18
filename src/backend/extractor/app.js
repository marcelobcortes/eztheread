'use strict'

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
                console.log(data)
                resolve(data)
            }
        });
    })
    // return JSON.stringify(event)
}