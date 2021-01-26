'use strict'

const region = 'us-east-1';
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region })
const s3 = new AWS.S3()
const iot = new AWS.Iot();
const sts = new AWS.STS();
const iam = new AWS.IAM();

const roleName = 'eztheread-client';
const URL_EXPIRATION_SECONDS = 300

exports.handler = async (event, context, callback) => {
    const fileName = uuidv4();

    const uploadUrl = await getUploadURL(fileName);
    const iot = await getIot(callback, fileName);

    return JSON.stringify({ uploadUrl, iot });
};

const getUploadURL = async function(fileName) {
    const Key = `${fileName}.pdf`;

    return await s3.createPresignedPost({
        Bucket: process.env.UploadBucket,
        Fields: {
            key: Key
        },
        Expires: URL_EXPIRATION_SECONDS,
        Conditions: [
			["content-length-range", 0, 20000000],
        ],
    });
};

const createRole = async () => {
    const params = {
        RoleName: roleName
    };
    try {
        // throws if role doesn't exist
        await iam.getRole(params).promise();
    } catch (err) {
        const identity = await sts.getCallerIdentity({}).promise();
        const createRoleParams = {
            AssumeRolePolicyDocument: `{
                "Version":"2012-10-17",
                "Statement":[{
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::${identity.Account}:root"
                    },
                    "Action": "sts:AssumeRole"
                    }
                ]
            }`,
            RoleName: roleName
        };

        await iam.createRole(createRoleParams).promise();

        const attachPolicyParams = {
            PolicyDocument: `{
                "Version": "2012-10-17",
                "Statement": [{
                "Action": ["iot:Connect", "iot:Subscribe", "iot:Publish", "iot:Receive"],
                "Resource": "*",
                "Effect": "Allow"
                }]
            }`,
            PolicyName: roleName,
            RoleName: roleName
        };

        // add iot policy
        await iam.putRolePolicy(attachPolicyParams);
    }
};

const getIot = async (callback, fileName) => {

    try {
        await createRole();
        const endpoint = await iot.describeEndpoint({}).promise();
        const identity = await sts.getCallerIdentity({}).promise();

        const params = {
            RoleArn: `arn:aws:iam::${identity.Account}:role/${roleName}`,
            RoleSessionName: fileName,
        };
        const role = await sts.assumeRole(params).promise();

        return {
                iotEndpoint: endpoint.endpointAddress,
                region: region,
                accessKey: role.Credentials.AccessKeyId,
                secretKey: role.Credentials.SecretAccessKey,
                sessionToken: role.Credentials.SessionToken
        };
    } catch (err) {
        callback(err);
    }
};