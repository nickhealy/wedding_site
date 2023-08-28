const {
	S3Client,
	GetObjectCommand,
} = require("@aws-sdk/client-s3");
const SessionCache = require('./sessionCache')

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
	const { email, password } = event.body;

	// Check if provided password matches the stored password
	if (password !== PASSWORD) {
		return {
			statusCode: 403,
			body: JSON.stringify({ message: "Invalid credentials" }),
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

		// Check if the provided email is in the mappings
		if (!guestPermissions[email]) {
			return {
				statusCode: 403,
				body: JSON.stringify({ message: "Unauthorized email" }),
			};
		}

		// Return success response with permissions in a cookie
		const permissions = guestPermissions[email];
		
		const newSessionToken = generateRandomHash()
		await SessionCache.set(email, newSessionToken)

		const response = {
			statusCode: 200,
			headers: {
				"Set-Cookie": `permissions=${encodeURIComponent(
					JSON.stringify(permissions)
				)}; HttpOnly; Path=/; session_token=${newSessionToken}; HttpOnly; Path=/`,
			},
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
