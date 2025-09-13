import * as fs from "node:fs";
import {parse} from "./Tree/Parser.js";
import {ArrayCursor} from "./Utils/ArrayCursor.js";
import * as path from "node:path";
import {renderDocument} from "./Tree/Render/RenderDocument.js";

const currentWorkingDirectory = process.cwd();

const rfcDirectory = path.join(currentWorkingDirectory, 'rfc');
const outputDirectory = path.join(currentWorkingDirectory, 'output');

fs.mkdirSync(rfcDirectory, {recursive: true});
fs.mkdirSync(outputDirectory, {recursive: true});

async function main() {
    const rfcFile = path.join(rfcDirectory, 'rfc6749.txt');
    const originalOutputFile = path.join(outputDirectory, 'rfc6749.original.txt');
    const outputFile = path.join(outputDirectory, 'rfc6749.txt');
    const astFile = path.join(outputDirectory, 'rfc6749.json');

    const content = fs.readFileSync(rfcFile, 'utf-8');
    const lines = content.replace(/\r?\n/g, '\n').split('\n');
    const cursor = new ArrayCursor(lines);
    const ast = parse(cursor);
    const output = renderDocument(ast);

    fs.writeFileSync(originalOutputFile, content);
    fs.writeFileSync(astFile, JSON.stringify(ast, null, 2));
    fs.writeFileSync(outputFile, output.join('\n'));

    console.dir(ast, {
        depth: null,
        maxArrayLength: 5000,
        compact: true,
    });
}


// Execution
function ErrorHandler(error: unknown) {
    console.error(error);
    process.exit(1);
}

main().catch(ErrorHandler);