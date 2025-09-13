import type {BlockMatcher} from "../BlockMatcher.js";
import {makePosition} from "../Parser.js";
import type {PageBreakNode} from "../Node/PageBreakNode.js";

export const PageBreakMatcher: BlockMatcher = {
    name: "pageBreak",
    // Run before blank line matcher so we catch form-feeds even if regex treats them as whitespace
    priority: 2,
    test: (context) => {
        const line = context.peek(0);
        if (line === null) {
            return false;
        }
        // Identify page breaks strictly by presence of form feed character
        return line.includes('\f');
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        context.advance();
        return {
            type: 'PageBreak',
            position: {start, end: makePosition(context.cursor, 0)},
        } as PageBreakNode;
    },
};

