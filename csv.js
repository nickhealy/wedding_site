const parseCsv =(csvData) => {
    // Split the CSV data into rows, considering both '\r\n' and '\n' line endings.
    const rows = csvData.split(/\r?\n/);

    // Get the column headers from the first row and remove any trailing '\r'.
    const headers = rows[0].replace(/\r$/, '').split(',');

    // Initialize an empty array to store the parsed data.
    const data = [];

    // Define a function to convert "TRUE" and "FALSE" to true and false, respectively.
    function convertBoolean(value) {
        if (value === 'TRUE') return true;
        if (value === 'FALSE') return false;
        return value; // If it's not "TRUE" or "FALSE", return as is.
    }

    // Iterate over the rows (excluding the header row) and create objects.
    for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].replace(/\r$/, '').split(',');
        const rowData = {};

        // Iterate over the columns and create key-value pairs.
        for (let j = 0; j < headers.length; j++) {
            rowData[headers[j]] = convertBoolean(columns[j]);
        }

        data.push(rowData);
    }

    return data
}

module.exports = {
    parseCsv
}

