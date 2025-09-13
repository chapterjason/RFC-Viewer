import * as fs from "node:fs";
import {parse} from "./Tree/Parser.js";
import {ArrayCursor} from "./Utils/ArrayCursor.js";


async function main() {
    const content = fs.readFileSync('./rfc/rfc6749.txt', 'utf-8');
    const lines = content.replace(/\r?\n/g, '\n').split('\n');
    const cursor = new ArrayCursor(lines);

    const ast = parse(cursor);

    for (const child of ast.children) {
        if (child.type === 'SectionTitle') {
            console.log(child.lines.join(' ').replace('\n', ' '));
        }
    }

    return;
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