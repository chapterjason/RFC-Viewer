import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {IndentedBlockMatcher} from "./IndentedBlockMatcher.js";
import {makePosition} from "../Parser.js";
import {paragraphFromLines} from "../../Utils/ParagraphFromLines.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";

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

            if (IndentedBlockMatcher.test(context)) {
                break;
            }

            // Stop before page boundaries (footer/break/header) so specialized matchers can handle them
            if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                break;
            }

            lines.push(line);
            context.advance();
        }
        return paragraphFromLines(lines, start.line, start);
    },
};
