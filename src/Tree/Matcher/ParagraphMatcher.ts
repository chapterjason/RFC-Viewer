import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {IndentedBlockMatcher} from "./IndentedBlockMatcher.js";
import {makePosition} from "../Parser.js";
import {paragraphFromLines} from "../../Utils/ParagraphFromLines.js";
import type {BlockMatcher} from "../BlockMatcher.js";

export const ParagraphMatcher: BlockMatcher = {
    name: "paragraph",
    priority: 90,
    test: (context) => {
        const line = context.peek(0);
        return line !== null && !isBlankLine(line);
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);

            if (line === null) {
                break;
            }

            if (isBlankLine(line)) {
                break;
            } // stop, let BlankLineMatcher handle it

            if (
                IndentedBlockMatcher.test(context)
            ) {
                break;
            }

            lines.push(line);
            context.advance();
        }
        return paragraphFromLines(lines, start.line, start);
    },
};