const handlebars = require("./handlebars.min-v4.7.8");
const path = require("path");
const fs = require("fs");
// Handlebars helper: Contains
// check if a value is contained in an array
handlebars.registerHelper("contains", function (value, array, options) {
    array = array instanceof Array ? array : [array];
    return array.indexOf(value) > -1 ? options.fn(this) : "";
});

module.exports = {
    compile: (handlebarsTemplate, data) => {
        const templatePath = path.join(
            __dirname,
            handlebarsTemplate
        );
        const templateSource = fs.readFileSync(templatePath, "utf8");
        const template = handlebars.compile(templateSource);

        return template(data);
    },
};
