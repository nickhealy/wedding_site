// const fs = require('fs');
// const readline = require('readline');

const headerMapping = {
    'ID': 'id',
    'Name': 'name',
    'Email': 'email',
    'Primary Guest Id': 'primary_guest_id',
    'Rank': 'rank',
    'Welcome Dinner': 'welcome_dinner',
    'Ceremony': 'ceremony',
    'Reception': 'reception',
    'Pool Party': 'pool_party',
    'Inviter': 'inviter',
    'RSVP Sent': 'rsvp_sent',
    'Mailing Address': 'mailing_address',
    'Welcome Dinner RSVP': 'welcome_dinner_rsvp',
    'Ceremony RSVP': 'ceremony_rsvp',
    'Reception RSVP': 'reception_rsvp',
    'Pool Party RSVP': 'pool_party_rsvp',
    'Dietary restrictions': 'dietary_restrictions',
};

const convertBoolean = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
};

const parseCsv = (csvData) => {
    console.log(csvData)
    const rows = csvData.split(/\r?\n/);
    const headers = rows[0].replace(/\r$/, '').split(',');
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].replace(/\r$/, '').split(',');
        const rowData = {};

        for (let j = 0; j < headers.length; j++) {
            const header = headerMapping[headers[j]] 
            if (!header) {
                throw new Error(`Unrecognized header ${headers[j]}`)
            }
            rowData[header] = convertBoolean(columns[j]);
        }

        data.push(rowData);
    }

    return data;
};

// const processCSVFile = (filePath) => {
//     if (!filePath) {
//         console.error('Please provide the path to the CSV file as a command-line argument.');
//     } else {
//         processCSVFile(filePath);
//     }
//
//     const fileStream = fs.createReadStream(filePath);
//     const rl = readline.createInterface({
//         input: fileStream,
//         crlfDelay: Infinity,
//     });
//
//     let csvData = '';
//
//     rl.on('line', (line) => {
//         csvData += line + '\n';
//     });
//
//     rl.on('close', () => {
//         const parsedData = parseCsv(csvData);
//         console.log(parsedData);
//     });
// };

module.exports = {
    parseCsv
}

