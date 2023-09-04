const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const SessionCache = require("./sessionCache");

const region = process.env.AWS_REGION;
const PASSWORD = process.env.SITE_PASSWORD;
const resourcesBucket = process.env.RESOURCES_BUCKET;

const s3 = new S3Client({ region });

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

exports.handler = async (event) => {
	console.log("event", event);
	let email = "",
		password = "";

	try {
		({ email, password } = JSON.parse(event.body));
	} catch (e) {
		console.error(e);
		return {
			statusCode: 500,
			body: "Internal Server error, this is bad :(",
		};
	}

	// Check if provided password matches the stored password
	if (password !== PASSWORD) {
		return {
			statusCode: 403,
			body: JSON.stringify({ message: "Invalid credentials, biatch" }),
		};
	}

	try {
		// Read email-permission mappings from S3
		const getObjectCommand = new GetObjectCommand({
			Bucket: resourcesBucket,
			Key: "guest_list.json",
		});

		console.log("getting guest data for ", email);
		const data = await s3.send(getObjectCommand);
		const guestsRaw = await data.Body.transformToString();
		const guestPermissions = JSON.parse(guestsRaw);

		const guestData = Object.values(guestPermissions).find(
			({ email: dbEmail }) => dbEmail === email
		);
		// Check if the provided email is in the mappings
		if (!guestData) {
			return {
				statusCode: 403,
				body: JSON.stringify({ message: "Unauthorized email" }),
			};
		}

		console.log(`found data for ${email}`);

		const { events, id } = guestData;
		const newSessionToken = generateRandomHash();
		await SessionCache.set(email, newSessionToken);

		const response = {
			statusCode: 200,
			cookies: [
				`events=${encodeURIComponent(
					JSON.stringify(events)
				)}; HttpOnly; Path=/;`,
				`id=${id}; HttpOnly; Path=/;`,
				`token=${newSessionToken}; HttpOnly; Path=/`,
			],
			body: JSON.stringify({ message: "Login successful" }),
		};
		return response;
	} catch (error) {
		console.error("Error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Internal server error" }),
		};
	}
};
