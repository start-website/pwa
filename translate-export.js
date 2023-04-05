const fs = require("fs");
const globs = require("globs");
const translatePlugin = require("gulp-translate/lib/plugin/plugin");
const translateConfig = require("./translate-config");

// Get the source file paths.
const filePaths = globs.sync(translateConfig.includedFilePaths,
{
    ignore: translateConfig.excludedFilePaths
});

// Create the export task.
const plugin = new translatePlugin.Plugin(translateConfig);
const task = plugin.export(translateConfig);

// Process the source files.
for (let filePath of filePaths)
{
    const fileContents = fs.readFileSync(filePath);
    const file = { contents: fileContents, path: filePath };

    task.process(file);
}

// Finalize the export task.
task.finalize();