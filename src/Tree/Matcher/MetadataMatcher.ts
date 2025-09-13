import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {MetadataNode} from "../Node/MetadataNode.js";
import {makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";

export const MetadataMatcher: BlockMatcher = {
    name: "metadata",
    priority: 1,
    test: (context) => {
        const seenMetadata = Boolean(context.state.seenMetadata);
        if (seenMetadata) {
            return false;
        }
        const line = context.peek(0);
        if (line === null) {
            return false;
        }
        // Match only at the beginning of document content (allowing leading blank lines)
        if (isBlankLine(line)) {
            return false;
        }
        const consumedLines = context.cursor.consumed().toArray();
        const sawNonBlankBefore = consumedLines.some((previousLine: string) => !isBlankLine(previousLine));
        return !sawNonBlankBefore;
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

        context.state.seenMetadata = true;

        return {
            type: "Metadata",
            lines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as MetadataNode;
    },
};
