const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");

const region = process.env.REGION;
const s3Client = new S3Client({ region });

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

        const { id, dietary_restrictions, events } = JSON.parse(event.body);
        if (!id) {
            console.error('Missing "id" property in the request body');
            return {
                statusCode: 400,
            };
        }

        const updatedParams = {
            Bucket: process.env.RESOURCES_BUCKET,
            Key: "rsvps.json",
            Body: JSON.stringify({
                ...rsvpsData,
                [id]: { dietary_restrictions, events },
            }),
        };
        const putObjectCommand = new PutObjectCommand(updatedParams);
        await s3Client.send(putObjectCommand);

        console.log("Data updated successfully");
        return {
            statusCode: 200,
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
        };
    }
};
