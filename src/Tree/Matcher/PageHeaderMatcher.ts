import type {BlockMatcher} from "../BlockMatcher.js";
import {makePosition} from "../Parser.js";
import type {PageHeaderNode} from "../Node/PageHeaderNode.js";
import {isBlankLine} from "../../Utils/IsBlankLine.js";

export const PageHeaderMatcher: BlockMatcher = {
    name: "pageHeader",
    priority: 3,
    test: (context) => {
        const line = context.peek(0);
        if (line === null || isBlankLine(line)) {
            return false;
        }
        const previous = context.cursor.peek(-1);
        return previous !== null && previous.includes('\f');
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const text = context.peek(0) ?? '';
        context.advance();
        return {
            type: 'PageHeader',
            text,
            position: {start, end: makePosition(context.cursor, 0)},
        } as PageHeaderNode;
    },
};

