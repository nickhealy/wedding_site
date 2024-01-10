const {
	DynamoDBClient,
	QueryCommand,
	BatchWriteItemCommand,
	BatchGetItemCommand,
	GetItemCommand,
	PutItemCommand,
	ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { parseCsv } = require("./csv");

const region = "eu-west-2";
const sessionsTableName = process.env.SESSIONS_TABLE_NAME || "sessions";
const guestListTableName = process.env.GUEST_LIST_TABLE_NAME || "guest-data";

const dynamoDB = new DynamoDBClient({ region });
const MAX_RETRIES = 5;

const checkForValidSession = async (id, sessionId, defaultValue = null) => {
	try {
		console.log(`getting session data for ${id}`);
		const getItemCommand = new GetItemCommand({
			TableName: sessionsTableName,
			Key: {
				id: { S: `${id}:${sessionId}` },
			},
			ProjectionExpression: "is_valid",
		});
		const { Item } = await dynamoDB.send(getItemCommand);

		if (Item) {
			const isValid = Item.is_valid.BOOL;
			return isValid;
		} else {
			return defaultValue;
		}
	} catch (e) {
		console.error("Error getting session data from DynamoDB:", e);
		return defaultValue;
	}
};


const saveRsvp = async (rsvps) => {
	for (const { dietary_restrictions, id, events } of rsvps) {
		const guestData = await getGuestDataForId(id);
		console.log({ events });

		const transformedData = {
			ceremony_rsvp: false,
			reception_rsvp: false,
			pool_party_rsvp: false,
			welcome_rsvp: false,
		};

		events.forEach((item) => {
			const eventName =
				item.event.toLowerCase().replace(" ", "_") + "_rsvp";
			transformedData[eventName] = item.rsvp || false;
		});
		const putItemCommand = new PutItemCommand({
			TableName: guestListTableName,
			Item: marshall({
				dietary_restrictions,
				...transformedData,
				...guestData, // there is a id: S here, so we need to be careful
				id: Number(id),
			}),
		});

		console.log("saving rsvp data");
		await dynamoDB.send(putItemCommand);
	}
};
const getGuestDataForId = async (id, defaultValue = null) => {
	try {
		console.log(`getting guest data for id ${id}`);
		const getItemCommand = new GetItemCommand({
			TableName: guestListTableName,
			Key: {
				id: { N: `${id}` },
			},
		});
		const { Item } = await dynamoDB.send(getItemCommand);
		console.log({ Item });

		if (!Item) {
			return defaultValue;
		}

		// we can easily add the specific rsvps here if we would like
		return {
			name: Item.name?.S,
			id: Item.id?.N,
			ceremony: Item.ceremony?.BOOL || false,
			reception: Item.reception?.BOOL || false,
			welcome_dinner: Item.welcome_dinner?.BOOL || false,
			pool_party: Item.pool_party?.BOOL || false,
			plus_ones: Item.plus_ones?.S || "",
			rsvpd: _hasRsvpd(Item),
			welcome_dinner_rsvp: Item.welcome_dinner_rsvp?.BOOL || false,
			pool_party_rsvp: Item.pool_party_rsvp?.BOOL || false,
			ceremony_rsvp: Item.ceremony_rsvp?.BOOL || false,
			reception_rsvp: Item.reception_rsvp?.BOOL || false,
		};
	} catch (e) {
		console.error("Error getting session data from DynamoDB:", e);
		return defaultValue;
	}
};

const _hasRsvpd = (dbItem) => {
	// get whether the user has rsvp'd or not
	const ceremonyRsvp = dbItem?.ceremony_rsvp?.BOOL;
	const receptionRsvp = dbItem?.reception_rsvp?.BOOL;
	const welcomeDinnerRsvp = dbItem?.welcome_dinner_rsvp?.BOOL;
	const poolPartyRsvp = dbItem?.pool_party_rsvp?.BOOL;

	const hasRsvpd =
		ceremonyRsvp !== undefined ||
		receptionRsvp !== undefined ||
		welcomeDinnerRsvp !== undefined ||
		poolPartyRsvp !== undefined;

	return hasRsvpd;
};

const setSessionId = async (id, sessionId) => {
	console.log("updating session for user ", id);
	const putItemCommand = new PutItemCommand({
		TableName: sessionsTableName,
		Item: {
			id: { S: `${id}:${sessionId}` },
			is_valid: { BOOL: true },
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
		ProjectionExpression: "rsvpd,email,id",
	};

	try {
		const queryCommand = new QueryCommand(params);
		const { Items } = await dynamoDB.send(queryCommand);
		console.log("Query results:", Items);
		const item = Items[0];

		return {
			email: item?.email?.S || null,
			id: item?.id?.N || null,
			rsvpd: _hasRsvpd(item),
		};
	} catch (error) {
		console.error("Error querying GSI:", error);
		return defaultVal;
	}
};

const saveGuestData = async (rawData) => {
	let retries = 0;
	const parsedData = parseCsv(rawData);
	const batchedData = [];
	let currBatch = [];

	// batch the data into 25 items long
	for (const data of parsedData) {
		currBatch.push(data);
		if (currBatch.length == 25) {
			batchedData.push(currBatch);
			currBatch = [];
		}
	}
	batchedData.push(currBatch);

	for (const batch of batchedData) {
		const batchPutConfig = {
			RequestItems: {
				[guestListTableName]: batch.reduce(batchPutReducer, []),
			},
		};

		const batchPutCommand = new BatchWriteItemCommand(batchPutConfig);
		console.log("saving guest data");
		let { UnprocessedItems } = await dynamoDB.send(batchPutCommand);

		while (Object.keys(UnprocessedItems).length) {
			if (retries++ < MAX_RETRIES) {
				console.error({ UnprocessedItems });
				throw new Error("Unprocessed items!");
			}
			console.log("retrying")(
				({ UnprocessedItems } = await dynamoDB.send({
					RequestItems: UnprocessedItems,
				}))
			);
		}
	}
};

const batchPutReducer = (
	acc,
	{
		id,
		name,
		email,
		inviter,
		plus_ones,
		welcome_dinner,
		ceremony,
		pool_party,
		reception,
		rsvp_sent,
		mailing_address,
		welcome_dinner_rsvp,
		ceremony_rsvp,
		reception_rsvp,
		pool_party_rsvp,
		dietary_restrictions,
	}
) => {
	acc.push({
		PutRequest: {
			Item: {
				id: {
					N: id,
				},
				name: {
					S: name,
				},
				email: {
					S: email.toLowerCase() || "", // just some data normalization
				},
				inviter: {
					S: inviter || "",
				},
				plus_ones: {
					S: plus_ones || "",
				},
				welcome_dinner: {
					BOOL: welcome_dinner,
				},
				ceremony: {
					BOOL: ceremony,
				},
				reception: {
					BOOL: reception,
				},
				pool_party: {
					BOOL: pool_party,
				},
				rsvp_sent: {
					BOOL: rsvp_sent,
				},
				mailing_address: {
					S: mailing_address || "",
				},
				welcome_dinner_rsvp: {
					BOOL: welcome_dinner_rsvp,
				},
				ceremony_rsvp: {
					BOOL: ceremony_rsvp,
				},
				reception_rsvp: {
					BOOL: reception_rsvp,
				},
				pool_party_rsvp: {
					BOOL: pool_party_rsvp,
				},
				dietary_restrictions: {
					S: dietary_restrictions || "",
				},
			},
		},
	});
	return acc;
};

module.exports = {
	checkForValidSession,
	setSessionId,
	getGuestInfo,
	saveGuestData,
	getGuestDataForId,
	saveRsvp,
};
