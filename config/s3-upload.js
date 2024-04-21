const aws = require('aws-sdk');
require('dotenv').config();

const isProduction = process.env.CONFIG === 'production';

aws.config.update({
  secretAccessKey: isProduction ? process.env.AWS_SECRET_ACCESS_KEY_PROD : process.env.AWS_SECRET_ACCESS_KEY_LOCAL,
  accessKeyId: isProduction ? process.env.AWS_ACCESS_KEY_PROD : process.env.AWS_ACCESS_KEY_LOCAL,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

const uploadToS3 = async (fileStream, key) => {
    try {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fileStream
      }).promise();
      return result;
    } catch (error) {
      console.error("Upload to S3 failed:", error);
      throw error;
    }
};

const deleteFromS3 = async (key) => {
    try {
        const result = await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }).promise();
        return result;
    } catch (error) {
        console.error("Delete from S3 failed:", error);
        throw error;
    }
};

module.exports = {uploadToS3, deleteFromS3};
