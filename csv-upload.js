const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const API_KEY = process.env.API_KEY;
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event, context) => {
    console.log({ event });
    try {
        // Extract CSV content from the request body
        const csvData = event.body;
        const apiKey = event.headers.authorization;

        if (apiKey !== `Bearer: ${API_KEY}`) {
            return {
                statusCode: 403,
                body: "UNAUTHORIZED, STAY AWAY FROM MY API",
            };
        }

        // Define the S3 bucket and object key where you want to save the CSV file
        const s3Bucket = process.env.RESOURCES_BUCKET;
        const s3ObjectKey = "guest_list.csv";

        // Upload the CSV data to S3
        const params = {
            Bucket: s3Bucket,
            Key: s3ObjectKey,
            Body: csvData,
        };

        await s3Client.send(new PutObjectCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "CSV file successfully uploaded to S3",
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error uploading CSV file to S3" }),
        };
    }
};
