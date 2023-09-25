const { getGuestInfo, setSessionId } = require("./db");

const PASSWORD = process.env.SITE_PASSWORD;


function generateRandomHash(length = 16) {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let hash = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charactersLength);
		hash += characters.charAt(randomIndex);
	}

	return hash;
}

const headers = {
	"Access-Control-Allow-Origin": "*", // Required for CORS support to work
	"Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
};

exports.handler = async (event) => {
	console.log("event", event);
	let email = "",
		password = "";

	try {
		({ email, password } = JSON.parse(event.body));
	} catch (e) {
		console.error(e);
		return {
			headers,
			statusCode: 500,
			body: "Internal Server error, this is bad :(",
		};
	}

	try {
		const { email: emailFromDb, rsvpd, id } = await getGuestInfo(email.toLowerCase())

		if (!emailFromDb) {
			return {
				headers,
				statusCode: 403,
				body: JSON.stringify({ message: "BAD_EMAIL" }),
			};
		}
		// Check if provided password matches the stored password
		if (password !== PASSWORD) {
			return {
				...headers,
				statusCode: 403,
				body: JSON.stringify({
					message: "BAD_PASSWORD",
				}),
			};
		}

		console.log(`found data for ${email}`);

		const newSessionToken = generateRandomHash();
		await setSessionId(id, newSessionToken);

		const response = {
			headers,
			statusCode: 200,
			cookies: [
				`user_id=${id}; HttpOnly; SameSite=None; Domain=nickandannabellegetmarried.com; Secure`,
				`session_id=${newSessionToken}; HttpOnly;  Domain=nickandannabellegetmarried.com; SameSite=None; Secure`,
				`has_rsvp=${rsvpd}; HttpOnly;  Domain=nickandannabellegetmarried.com; SameSite=None; Secure`,
			],
		};
		return response;
	} catch (error) {
		console.error("Error:", error);
		return {
			headers,
			statusCode: 500,
			body: JSON.stringify({ message: "Internal server error" }),
		};
	}
};
