import type {BlockMatcher} from "../BlockMatcher.js";
 
import type {PageFooterNode} from "../Node/PageFooterNode.js";
import {isBlankLine} from "../../Utils/IsBlankLine.js";

export const PageFooterMatcher: BlockMatcher = {
    name: "pageFooter",
    priority: 3,
    test: (context) => {
        const line = context.peek(0);
        if (line === null || isBlankLine(line)) {
            return false;
        }
        const next = context.peek(1);
        return next !== null && next.includes('\f');
    },
    parse: (context) => {
        const text = context.peek(0) ?? '';
        context.advance();
        return {
            type: 'PageFooter',
            text,
        } as PageFooterNode;
    },
};
