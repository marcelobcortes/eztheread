'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

// Main Lambda entry point
exports.handler = async (event) => {
    // const uploadUrl = await getUploadURL(event)
    return await getUploadURL(event)
    
}

const getUploadURL = async function(event) {
    const randomID = parseInt(Math.random() * 10000000)
    const Key = `${randomID}.pdf`

    // Get signed URL from S3
    const s3Params = {
        Bucket: process.env.UploadBucket,
        Key,
        Expires: URL_EXPIRATION_SECONDS,
        ContentType: 'application/pdf',

        // This ACL makes the uploaded object publicly readable. You must also uncomment
        // the extra permission for the Lambda function in the SAM template.

        // ACL: 'public-read'
    }

    console.log('Params: ', s3Params)
    const uploadURL = await s3.createPresignedPost({
        Bucket: process.env.UploadBucket,
        Fields: {
            key: Key
        },
        Expires: URL_EXPIRATION_SECONDS,
        Conditions: [
			["content-length-range", 0, 20000000],
        ],
        
    })

    return JSON.stringify(uploadURL)
}