const fs = require('fs');
const path = require('path');
const handlebars = require("../static/handlebars.min-v4.7.8");
const { warn } = require('console');

const inputDirectory = 'test-data';
const outputDirectory = '../static';

// Read the main handlebars template
const templatePath = path.join(__dirname, '..', 'static', 'main.handlebars.html');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(templateSource);

// Ensure the output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// Handlebars helper: Contains
// check if a value is contained in an array
handlebars.registerHelper("contains", function( value, array, options ){
	array = ( array instanceof Array ) ? array : [array];
	return (array.indexOf(value) > -1) ? options.fn( this ) : "";
});

// Read each JSON file in the input directory
fs.readdirSync(inputDirectory).forEach((file) => {
  if (file.endsWith('.json')) {
    const jsonFilePath = path.join(inputDirectory, file);
    const jsonData = require(`./${ jsonFilePath }`); // Load JSON data from file

    // Render the template with JSON data
    const html = template(jsonData);

    // Determine the output file path
    const outputFilePath = path.join(outputDirectory, `test-${path.parse(file).name}.html`);

    // Write the rendered HTML to the output file
    fs.writeFileSync(outputFilePath, html);
    console.log(`Rendered ${file} to ${outputFilePath}`);
  }
});

console.log('Done rendering HTML files.');
