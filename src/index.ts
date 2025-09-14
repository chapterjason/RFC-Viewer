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

const numbers = [
    6749,
    6819,
    7591,
    7636,
    8252,
    8693,
    9126,
    9396,
    6750,
    7009,
    7592,
    7662,
    8414,
    9101,
    9207,
    9700,
];

async function main() {
    for (const number of numbers) {
        const rfcFile = path.join(rfcDirectory, `rfc${number}.txt`);
        const originalOutputFile = path.join(outputDirectory, `rfc${number}.original.txt`);
        const outputFile = path.join(outputDirectory, `rfc${number}.txt`);
        const astFile = path.join(outputDirectory, `rfc${number}.json`);

        const content = fs.readFileSync(rfcFile, 'utf-8');
        const lines = content.replace(/\r?\n/g, '\n').split('\n');
        const cursor = new ArrayCursor(lines);
        const ast = parse(cursor);
        const output = renderDocument(ast);

        fs.writeFileSync(originalOutputFile, content);
        fs.writeFileSync(astFile, JSON.stringify(ast, null, 2));
        fs.writeFileSync(outputFile, output.join('\n'));
    }
}


// Execution
function ErrorHandler(error: unknown) {
    console.error(error);
    process.exit(1);
}

main().catch(ErrorHandler);