const { DynamoDBClient, QueryCommand, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const region = process.env.AWS_REGION;
const sessionsTableName = process.env.SESSIONS_TABLE_NAME;
const guestListTableName = process.env.GUEST_LIST_TABLE_NAME;

const dynamoDB = new DynamoDBClient({ region });

const checkForValidSession = async (id, sessionId, defaultValue = null) => {
	try {
		console.log(`getting session data for ${id}`);
		const getItemCommand = new GetItemCommand({
			TableName: sessionsTableName,
			Key: {
				"id": { S: `${id}:${sessionId}` },
			},
			ProjectionExpression: "is_valid"
		});
		const { Item } = await dynamoDB.send(getItemCommand);

		if (Item) {
			const isValid = Item.is_valid.BOOL;
			return isValid
		} else {
			return defaultValue;
		}
	} catch (e) {
		console.error("Error getting session data from DynamoDB:", e);
		return defaultValue;
	}
};

const setSessionId = async (id, sessionId) => {
	console.log("updating session for user ", id);
	const putItemCommand = new PutItemCommand({
		TableName: sessionsTableName,
		Item: {
			"id": { S: `${id}:${sessionId}` },
			"is_valid": { BOOL: true },
		},
	});

	await dynamoDB.send(putItemCommand);
};

const getGuestInfo = async (email, defaultVal = null) => {
	const params = {
		TableName: guestListTableName,
		IndexName: "EmailIndex",
		KeyConditionExpression: "email = :email",
		ExpressionAttributeValues: {
			":email": { S: email},
		},
		ProjectionExpression: "rsvpd,email,id"
	};

	try {
		const queryCommand = new QueryCommand(params);
		const { Items } = await dynamoDB.send(queryCommand);
		console.log("Query results:", Items);
		const item = Items[0]

		return {
			email: item?.email?.S || null,
			id: item?.id?.N || null,
			rsvpd: item?.rsvpd?.BOOL || null,
		}
	} catch (error) {
		console.error("Error querying GSI:", error);
		return defaultVal
	}
}

module.exports = {
	checkForValidSession,
	setSessionId,
	getGuestInfo
};
