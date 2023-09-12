const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");

const region = process.env.REGION;
const s3Client = new S3Client({ region });

const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
};

exports.handler = async (event) => {
    try {
        const params = {
            Bucket: process.env.RESOURCES_BUCKET,
            Key: "rsvps.json",
        };
        const getObjectCommand = new GetObjectCommand(params);
        let rsvpsData;
        try {
            const response = await s3Client.send(getObjectCommand);
            const string = await response.Body.transformToString();
            rsvpsData = JSON.parse(string);
        } catch {
            rsvpsData = {};
        }

        const rsvps = JSON.parse(event.body);
        console.log({rsvps})

        const updatedParams = {
            Bucket: process.env.RESOURCES_BUCKET,
            Key: "rsvps.json",
            Body: JSON.stringify({
                ...rsvpsData,
                ...rsvps.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
            }),
        };
        const putObjectCommand = new PutObjectCommand(updatedParams);
        await s3Client.send(putObjectCommand);

        console.log("Data updated successfully");
        return {
            headers,
            statusCode: 200,
        };
    } catch (error) {
        console.error(error);
        return {
            headers,
            statusCode: 500,
        };
    }
};
