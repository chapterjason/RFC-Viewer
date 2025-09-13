import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {TitleNode} from "../Node/TitleNode.js";
import {getIndentation, makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";

export const TitleMatcher: BlockMatcher = {
    name: "title",
    priority: 20,
    test: (context) => {
        const seenMetadata = Boolean(context.state.seenMetadata);
        const seenTitle = Boolean(context.state.seenTitle);
        if (!seenMetadata || seenTitle) {
            return false;
        }
        const line = context.peek(0);
        if (line === null) {
            return false;
        }
        // Require a non-blank line with some indentation (centered)
        if (isBlankLine(line)) {
            return false;
        }
        if (getIndentation(line) < 2) {
            return false;
        }
        return true;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];
        while (!context.cursor.isEOL()) {
            const current = context.peek(0);
            if (current === null) {
                break;
            }
            if (isBlankLine(current)) {
                break;
            }
            lines.push(current);
            context.advance();
        }
        context.state.seenTitle = true;
        return {
            type: "Title",
            lines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as TitleNode;
    },
};
