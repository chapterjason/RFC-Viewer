import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {IndentedBlockNode} from "../Node/IndentedBlockNode.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";

export const IndentedBlockMatcher: BlockMatcher = {
    name: "indentedBlock",
    priority: 50,
    test: (context) => {
        const line = context.peek(0);
        return line !== null && getIndentation(line) >= 4;
    },
    parse: (context) => {
        const lines: string[] = [];
        const base = Math.min(4, getIndentation(context.peek(0)!));
        while (!context.cursor.isEOL()) {
            const s = context.peek(0)!;
            if (isBlankLine(s)) {
                break;
            }
            if (getIndentation(s) < base) {
                break;
            }
            lines.push(sliceLineText(s, base));
            context.advance();
        }
        return {
            type: "IndentedBlock",
            indent: base,
            lines,
            
        } as IndentedBlockNode;
    },
};
