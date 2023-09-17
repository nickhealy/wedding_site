const { compile } = require("./handlebars");
const { checkForValidSession, getGuestDataForId } = require("./db");

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

                if (await checkForValidSession(userId, sessionId)) {
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
        return {
            status: "302",
            statusDescription: "Found",
            headers: {
                location: [
                    {
                        key: "location",
                        value: "/error.html",
                    },
                ],
            },
        };
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


const getGuestData = async (id) => {
    const guestData = await getGuestDataForId(id)

    // Check if the user_id exists in the JSON object
    if (!guestData) {
        throw new Error(`no guest data found for id ${id}`);
    }

    const templateData = {
        invites: [guestData.name], // start off with main invitee as the first invite
        events: [],
    };

    if (guestData.rsvpd) {
        templateData.has_rsvp = true;
    }

    if (guestData.reception) {
        templateData.events.push("reception");
    }

    if (guestData.ceremony) {
        templateData.events.push("ceremony");
    }

    if (guestData.welcome_dinner) {
        templateData.other_events = true;
        templateData.events.push("welcome dinner");
    }

    if (guestData.pool_party) {
        templateData.other_events = true;
        templateData.events.push("pool party");
    }

    // get the plus one data here
    // for (const plusOneId of guestData.plus_ones) {
    //     const {name} = await getGuestInfo
    //     templateData.invites.push(plusOneData.Name);
    // }
    console.log({ guestData });

    return templateData;
};
