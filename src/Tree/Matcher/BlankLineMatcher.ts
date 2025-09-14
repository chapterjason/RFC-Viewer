import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlankLineNode} from "../Node/BlankLineNode.js";
import type {BlockMatcher} from "../BlockMatcher.js";

export const BlankLineMatcher: BlockMatcher = {
    name: "blankLine",
    priority: 5,
    test: (context) => {
        const line = context.peek(0);
        return isBlankLine(line);
    },
    parse: (context) => {
        context.advance();
        return {type: "BlankLine"} as BlankLineNode;
    },
};
