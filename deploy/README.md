https://github.com/awslabs/aws-cloudformation-templates/tree/a11722d/aws/services/CloudFormation/MacrosExamples/S3Objects

Go to the 'macro' folder and run:

`aws cloudformation package \
    --template-file macro.template \
    --s3-bucket eztheread-frontend \
    --output-template-file packaged.template`

`aws cloudformation deploy \
    --stack-name s3objects-macro \
    --template-file packaged.template \
    --capabilities CAPABILITY_IAM`