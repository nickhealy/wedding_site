const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Directory containing JSON files
const inputDirectory = 'test_data';

// Output directory
const outputDirectory = 'out';

// Read the main handlebars template
const templatePath = path.join(__dirname, '..', 'static', 'main.handlebars.html');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(templateSource);

// Ensure the output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// Read each JSON file in the input directory
fs.readdirSync(inputDirectory).forEach((file) => {
  if (file.endsWith('.json')) {
    const jsonFilePath = path.join(inputDirectory, file);
    const jsonData = require(jsonFilePath); // Load JSON data from file

    // Render the template with JSON data
    const html = template(jsonData);

    // Determine the output file path
    const outputFilePath = path.join(outputDirectory, `${path.parse(file).name}.html`);

    // Write the rendered HTML to the output file
    fs.writeFileSync(outputFilePath, html);
    console.log(`Rendered ${file} to ${outputFilePath}`);
  }
});

console.log('Done rendering HTML files.');
