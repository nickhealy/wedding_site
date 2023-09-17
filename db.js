const { DynamoDBClient, QueryCommand, BatchWriteItemCommand, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { parseCsv } = require('./csv')

const region = process.env.AWS_REGION;
const sessionsTableName = process.env.SESSIONS_TABLE_NAME;
const guestListTableName = process.env.GUEST_LIST_TABLE_NAME;

const dynamoDB = new DynamoDBClient({ region });
const MAX_RETRIES = 5

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
			":email": { S: email },
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

const saveGuestData = async (rawData) => {
	let retries = 0
	const parsedData = parseCsv(rawData)
	const batchedData = []
	let currBatch = []

	// batch the data into 25 items long
	for (const data of parsedData) {
		currBatch.push(data)
		if (currBatch.length == 25) {
			batchedData.push(currBatch)
			currBatch = []
		}
	}
	batchedData.push(currBatch)

	for (const batch of batchedData) {
		const batchPutConfig = {
			RequestItems: {
				[guestListTableName]: batch.reduce(batchPutReducer, [])
			}
		}

		const batchPutCommand = new BatchWriteItemCommand(batchPutConfig)
		console.log("saving guest data")
		let { UnprocessedItems } = await dynamoDB.send(batchPutCommand)

		while (Object.keys(UnprocessedItems).length) {
			if (retries++ < MAX_RETRIES) {
				console.error({ UnprocessedItems })
				throw new Error("Unprocessed items!")
			}
			console.log("retrying")
				(
					{ UnprocessedItems } = await dynamoDB.send({ RequestItems: UnprocessedItems })
				)
		}
	}
}

const batchPutReducer = (acc, {
	id,
	name,
	email,
	inviter,
	plus_ones,
	welcome_dinner,
	ceremony,
	rsvp_sent,
	mailing_address,
	welcome_dinner_rsvp,
	ceremony_rsvp,
	reception_rsvp,
	pool_party_rsvp,
	dietary_restrictions
}) => {
	acc.push(
		{
			PutRequest: {
				Item: {
					id: {
						N: id
					},
					name: {
						S: name
					},
					email: {
						S: email || ''
					},
					inviter: {
						S: inviter || ''
					},
					plus_ones: {
						S: plus_ones || ''
					},
					welcome_dinner: {
						BOOL: welcome_dinner
					},
					ceremony: {
						BOOL: ceremony
					},
					rsvp_sent: {
						BOOL: rsvp_sent
					},
					mailing_address: {
						S: mailing_address || ''
					},
					welcome_dinner_rsvp: {
						BOOL: welcome_dinner_rsvp
					},
					ceremony_rsvp: {
						BOOL: ceremony_rsvp
					},
					reception_rsvp: {
						BOOL: reception_rsvp
					},
					pool_party_rsvp: {
						BOOL: pool_party_rsvp
					},
					dietary_restrictions: {
						S: dietary_restrictions || ''
					},
				}
			}
		}
	)
	return acc
}

module.exports = {
	checkForValidSession,
	setSessionId,
	getGuestInfo,
	saveGuestData
};
