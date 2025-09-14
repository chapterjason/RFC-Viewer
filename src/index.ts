import * as fs from "node:fs";
import {parse} from "./Tree/Parser.js";
import {ArrayCursor} from "./Utils/ArrayCursor.js";
import * as path from "node:path";
import {renderDocument} from "./Tree/Render/RenderDocument.js";
import {patch} from "./Tree/Patch/Patch.js";
import {existsSync} from "node:fs";

const currentWorkingDirectory = process.cwd();

const rfcDirectory = path.join(currentWorkingDirectory, 'rfc');
const outputDirectory = path.join(currentWorkingDirectory, 'output');
const patchesDirectory = path.join(currentWorkingDirectory, 'patches');

fs.mkdirSync(rfcDirectory, {recursive: true});
fs.mkdirSync(outputDirectory, {recursive: true});
fs.mkdirSync(patchesDirectory, {recursive: true});

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
        const rfcPatchesDirectory = path.join(patchesDirectory, `${number}`);
        const rfcFile = path.join(rfcDirectory, `rfc${number}.txt`);
        const originalOutputFile = path.join(outputDirectory, `rfc${number}.original.txt`);
        const modifiedOutputFile = path.join(outputDirectory, `rfc${number}.txt`);
        const originalAstFile = path.join(outputDirectory, `rfc${number}.original.json`);
        const modifiedAstFile = path.join(outputDirectory, `rfc${number}.json`);

        const content = fs.readFileSync(rfcFile, 'utf-8');
        const lines = content.replace(/\r?\n/g, '\n').split('\n');
        const cursor = new ArrayCursor(lines);
        const ast = parse(cursor);

        let modifiedAst = JSON.parse(JSON.stringify(ast));

        if(existsSync(rfcPatchesDirectory)) {
            const patchFiles = fs.readdirSync(rfcPatchesDirectory);

            patchFiles
                .filter(item => item.endsWith('.patch.json'))
                .sort();

            for (const patchFile of patchFiles) {
                const patchContent = fs.readFileSync(path.join(rfcPatchesDirectory, patchFile), 'utf-8');
                const patchAst = JSON.parse(patchContent);

                modifiedAst = patch(modifiedAst, patchAst);
            }
        }

        const output = renderDocument(ast);

        fs.writeFileSync(originalOutputFile, content);
        fs.writeFileSync(originalAstFile, JSON.stringify(ast, null, 2));

        fs.writeFileSync(modifiedOutputFile, output.join('\n'));
        fs.writeFileSync(modifiedAstFile, JSON.stringify(modifiedAst, null, 2));
    }
}


// Execution
function ErrorHandler(error: unknown) {
    console.error(error);
    process.exit(1);
}

main().catch(ErrorHandler);