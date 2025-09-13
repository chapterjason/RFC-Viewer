import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlankLineNode} from "../Node/BlankLineNode.js";
import {makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";

export const BlankLineMatcher: BlockMatcher = {
    name: "blankLine",
    priority: 5,
    test: (context) => {
        const line = context.peek(0);
        return isBlankLine(line);
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        context.advance();
        return {type: "BlankLine", position: {start, end: makePosition(context.cursor, 0)}} as BlankLineNode;
    },
};