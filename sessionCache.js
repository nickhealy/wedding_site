const {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const resourcesBucket = process.env.RESOURCES_BUCKET;
const SESSIONS_KEY = "sessions.json";

const s3 = new S3Client({ region });

const get = async (defaultValue = {}) => {
	try {
		console.log("getting session data from s3");
		const getSessionsCommand = new GetObjectCommand({
			Bucket: resourcesBucket,
			Key: SESSIONS_KEY,
		});
		const sessionsData = await s3.send(getSessionsCommand);
		const sessionsRaw = await sessionsData.Body.transformToString();
		return JSON.parse(sessionsRaw);
	} catch (e) {
		// File might not exist yet
		return defaultValue;
	}
};

const set = async (email, value) => {
	const sessions = await get();
	sessions[email] = value;
	const putObjectCommand = new PutObjectCommand({
		Bucket: resourcesBucket,
		Key: SESSIONS_KEY,
		Body: JSON.stringify(sessions),
	});

	console.log("updating session for", email);
	await s3.send(putObjectCommand);
};

module.exports = {
	get,
	set,
};
