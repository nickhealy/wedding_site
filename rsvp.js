const {
    S3Client,
} = require("@aws-sdk/client-dynamodb");
const { saveRsvp } = require("./db");

const region = process.env.AWS_REGION;

const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
};

exports.handler = async (event) => {
    try {
        const rsvps = JSON.parse(event.body);
        console.log({rsvps})

        await saveRsvp(rsvps)
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
