import type {BlockMatcher} from "../BlockMatcher.js";
 
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
        const text = context.peek(0) ?? '';
        context.advance();
        return {
            type: 'PageHeader',
            text,
        } as PageHeaderNode;
    },
};
