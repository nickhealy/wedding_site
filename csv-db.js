const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const region = "eu-west-2";
const guestListTableName = process.env.GUEST_LIST_TABLE_NAME || "guest-data";

const dynamoDB = new DynamoDBClient({ region });

const getGuests = async () => {
    const params = {
        TableName: guestListTableName,
    };

    const command = new ScanCommand(params);

    const scanResults = [];
    let items;
    do {
        items = await dynamoDB.send(command);
        console.log({ items})
        items.Items.forEach((item) => { 
            const data = unmarshall(item)
            scanResults.push([
                data.id,
                data.name,
                '', // primary guest id
                data.email,
                data.welcome_dinner,
                data.ceremony,
                data.reception,
                data.pool_party,
                data.rsvp_sent,
                data.mailing_address,
                data.welcome_dinner_rsvp,
                data.ceremony_rsvp,
                data.reception_rsvp,
                data.pool_party_rsvp,
                data.dietary_restrictions
            ]) 
            console.log({data})
        })
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    console.log(scanResults)


    return scanResults.sort((left, right) => left[0] - right[0]);
};

module.exports = {
    getGuests,
};
