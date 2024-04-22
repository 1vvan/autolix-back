const aws = require('aws-sdk');
require('dotenv').config();
const pool = require('../db')
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = process.env.CRYPTO_SECRET_KEY;

function decrypt(hash) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrpyted.toString();
}

async function getCredentials() {
    const query = 'SELECT access_key_id, secret_access_key FROM aws_credentials WHERE id = $1;';
    const values = [1];
    
    try {
        const res = await pool.query(query, values);
        if (res.rows.length > 0) {
            const { access_key_id, secret_access_key } = res.rows[0];
            const accessKeyId = decrypt(JSON.parse(access_key_id));
            const secretAccessKey = decrypt(JSON.parse(secret_access_key));
            return { accessKeyId, secretAccessKey };
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function configureAWS() {
    const credentials = await getCredentials();
    if (credentials) {
        aws.config.update({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: process.env.AWS_REGION
        });
    }
}

const awsReady = new Promise(async (resolve, reject) => {
    try {
        await configureAWS();
        resolve();
    } catch (error) {
        console.error("Failed to configure AWS:", error);
        reject(error);
    }
});

const uploadToS3 = async (fileStream, key) => {
    await awsReady;
    try {
    const s3 = new aws.S3();
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
    await awsReady;
    try {
        const s3 = new aws.S3();
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
