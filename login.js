const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const PASSWORD = process.env.SITE_PASSWORD;
const guestListBucket = process.env.RESOURCES_BUCKET;

const s3 = new S3Client({ region });

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
			Bucket: guestListBucket,
			Key: "guest_list.json",
		});

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
		const response = {
			statusCode: 200,
			headers: {
				"Set-Cookie": `permissions=${encodeURIComponent(
					JSON.stringify(permissions)
				)}; HttpOnly; Path=/`,
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
