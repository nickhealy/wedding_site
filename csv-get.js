const { getGuests } = require("./csv-db");
const API_KEY = process.env.API_KEY;


exports.handler = async (event) => {
    try {
        // Extract CSV content from the request body
        const apiKey = event.headers.authorization;

        console.log({ apiKey, API_KEY });
        if (apiKey !== `Bearer: ${API_KEY}`) {
            return {
                statusCode: 403,
                headers: {
                    "Content-Type": "application/json",
                },
                body: "UNAUTHORIZED, STAY AWAY FROM MY API",
            };
        }

        const data = await getGuests();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error, status: "failed" }),
        };
    }
};
