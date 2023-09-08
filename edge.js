const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client();
const RESOURCES_BUCKET = "nickbelle-site-resources";
const SESSIONS_KEY = "sessions.json";

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;

    try {
        // Check if the request contains cookies
        const cookies = request.headers["cookie"];
        if (cookies) {
            const userIdCookie = cookies.find((cookie) =>
                cookie.value.includes("user_id=")
            );
            const sessionIdCookie = cookies.find((cookie) =>
                cookie.value.includes("session_id=")
            );
            if (userIdCookie && sessionIdCookie) {
                console.log("found both user_id and session_id");
                const userId = getUserIdFromCookie(userIdCookie.value);
                const sessionId = getSessionIdFromCookie(sessionIdCookie.value);

                if (await isValidSession(userId, sessionId)) {
                    // User is authenticated, do nothing
                    return request;
                }
            }
            console.log("one or both of user_id or session_id is missing");
        }
    } catch (error) {
        console.error("Error:", error);
    }
    return {
        status: "302",
        statusDescription: "Found",
        headers: {
            location: [
                {
                    key: "location",
                    value: "/login.html",
                },
            ],
        },
    };
};

function getUserIdFromCookie(cookieValue) {
    // Parse the user_id from the cookie
    // Example: user_id=12345; ...
    const userIdMatch = cookieValue.match(/user_id=([^;]*)/);
    return userIdMatch ? userIdMatch[1] : null;
}

function getSessionIdFromCookie(cookieValue) {
    // Parse the session_id from the cookie
    // Example: session_id=abcdef; ...
    const sessionIdMatch = cookieValue.match(/session_id=([^;]*)/);
    return sessionIdMatch ? sessionIdMatch[1] : null;
}

async function isValidSession(userId, sessionId) {
    try {
        // Fetch the JSON object from S3
        const getObjectParams = {
            Bucket: RESOURCES_BUCKET,
            Key: SESSIONS_KEY,
        };

        console.log("checking user's sessions");
        const s3Object = await s3Client.send(
            new GetObjectCommand(getObjectParams)
        );

        const jsonObject = JSON.parse(await s3Object.Body.transformToString());
        // Check if the user_id exists in the JSON object
        if (jsonObject[userId] && jsonObject[userId] === sessionId) {
            console.log("user has valid session");
            return true;
        }
        console.log("user does not have valid session");
        return false;
    } catch (error) {
        console.error("Error fetching S3 object:", error);
    }

    return false;
}
