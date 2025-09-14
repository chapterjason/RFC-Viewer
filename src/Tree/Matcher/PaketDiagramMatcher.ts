import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";
import type {PaketDiagramNode} from "../Node/PaketDiagramNode.js";
import {isFigureCaption} from "../../Utils/IsFigureCaption.js";
import {isConsecutive} from "../../Utils/IsConsecutive.js";
import {isConsecutiveCycled} from "../../Utils/IsConsecutiveCycled.js";

function isByteLine(line: string): boolean {
    line = line.trim();

    if (!/^[0-9 ]+$/.test(line)) {
        return false;
    }

    const numbers = line.split(' ')
        .filter(item => item.trim() !== '')
        .map(item => parseInt(item))
    ;

    if (numbers.length === 0) {
        return false;
    }

    return isConsecutive(numbers);
}

function isBitLine(line: string): boolean {
    line = line.trim();

    if (!/^[0-9 ]+$/.test(line)) {
        return false;
    }

    if (!/^[0-9 ]+$/.test(line)) {
        return false;
    }

    const numbers = line.split(' ')
        .filter(item => item.trim() !== '')
        .map(item => parseInt(item))
    ;

    if (numbers.length === 0) {
        return false;
    }

    return isConsecutiveCycled(numbers);
}

export const PaketDiagramMatcher: BlockMatcher = {
    name: "paketDiagram",
    priority: 36,
    test: (context) => {
        const line1 = context.peek(0);

        if (line1 === null || isBlankLine(line1)) {
            return false;
        }

        if (getIndentation(line1) < 3) {
            return false;
        }

        /**
         * Heuristic:
         * - first line: isByteLine
         * - second line: isBitLine
         * - third line: only contains "+" signs
         */

        if (!isByteLine(line1)) {
            return false;
        }

        const line2 = context.peek(1)!;

        if (!isBitLine(line2)) {
            return false;
        }

        const line3 = context.peek(2)!;

        if (/^[+-]+$/.test(line3.trim())) {
            return true;
        }

        return false;
    },
    parse: (context) => {
        const diagramLines: string[] = [];
        const firstLine = context.peek(0)!;
        const base = Math.min(3, getIndentation(firstLine));

        // 1) Consume diagram lines
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);

            if (line === null || isBlankLine(line)) {
                break;
            }

            const indent = getIndentation(line);

            if (indent < base) {
                break;
            }

            const text = line.trim();

            if (
                !isByteLine(text) &&
                !isBitLine(text) &&
                !text.startsWith("+") &&
                !text.startsWith("|")
            ) {
                break;
            }

            diagramLines.push(sliceLineText(line, base));
            context.advance();
        }

        // 2) Preserve blank lines directly after the table (as empty strings)
        while (!context.cursor.isEOL() && isBlankLine(context.peek(0))) {
            diagramLines.push("");
            context.advance();
        }

        // 3) Optional single-line caption immediately after (at >= base indent)
        if (!context.cursor.isEOL()) {
            const cap = context.peek(0)!;

            if (getIndentation(cap) >= base && isFigureCaption(cap)) {
                diagramLines.push(sliceLineText(cap, base));

                context.advance();
            }
        }

        return {
            type: "PaketDiagram",
            indent: base,
            lines: diagramLines,
        } as PaketDiagramNode;
    },
};
