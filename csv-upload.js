const { saveGuestData } = require('./db')
const API_KEY = process.env.API_KEY;

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

        await saveGuestData(csvData);

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'success',
                message: "CSV file successfully uploaded to S3",
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error, status: 'failed' }),
        };
    }
};
