const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { compile } = require("./handlebars");
const { parseCsv } = require("./csv");

const s3Client = new S3Client({ region: "eu-west-2" });
const RESOURCES_BUCKET = "nickbelle-site-resources";
const SESSIONS_KEY = "sessions.json";
const GUEST_LIST_KEY = "guest_list.csv";
const MAIN_TEMPATE = "main.handlebars.html";

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    console.log({ request });

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
                    const guestData = await getGuestData(userId);
                    response = {
                        status: "200",
                        statusDescription: "OK",
                        headers: {
                            "cache-control": [
                                {
                                    key: "Cache-Control",
                                    value: "max-age=100",
                                },
                            ],
                            "content-type": [
                                {
                                    key: "Content-Type",
                                    value: "text/html",
                                },
                            ],
                        },
                        body: compile(MAIN_TEMPATE, guestData),
                    };
                    return response;
                }
            }
            console.log("one or both of user_id or session_id is missing");
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;
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
        console.error("Error fetching sessions:", error);
    }

    return false;
}

const isTrue = (val) => val === 'true'
const getGuestData = async (userId) => {
    // Read email-permission mappings from S3
    const getObjectCommand = new GetObjectCommand({
        Bucket: RESOURCES_BUCKET,
        Key: GUEST_LIST_KEY,
    });

    console.log("getting guest data for userId ", userId);
    const data = await s3Client.send(getObjectCommand);
    const guestsRaw = await data.Body.transformToString();
    const parsedGuestsRaw = parseCsv(guestsRaw);
    const guestData = parsedGuestsRaw.find(
        ({ ID: id }) => id.toString() === userId.toString()
    );

    // Check if the user_id exists in the JSON object
    if (!guestData) {
        throw new Error("could not find guest data");
    }

    const templateData = {
        invites: [guestData.name], // start off with main invitee as the first invite
        events: [],
    };

    if (isTrue(guestData["RSVP'd"])) {
        templateData.has_rsvp = true;
    }

    if (isTrue(guestData["Reception"])) {
        templateData.events.push("reception");
    }

    if (isTrue(guestData["Ceremony"])) {
        templateData.events.push("ceremony");
    }

    if (isTrue(guestData["Welcome Dinner"])) {
        templateData.other_events = true;
        templateData.events.push("welcome dinner");
    }

    if (isTrue(guestData["Pool Party"])) {
        templateData.other_events = true;
        templateData.events.push("pool party");
    }

    for (const plusOneId of guestData["Plus Ones"]) {
        const plusOneData = parsedGuestsRaw.find(
            ({ ID: id }) => id.toString() === plusOneId.toString()
        );

        templateData.invites.push(plusOneData.Name);
    }
    console.log({ guestData });

    return templateData;
};
