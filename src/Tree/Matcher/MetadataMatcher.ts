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
        // Only at document start (no prior non-blank content)
        const consumedLines = context.cursor.consumed().toArray();
        const sawNonBlankBefore = consumedLines.some((previousLine: string) => !isBlankLine(previousLine));
        if (sawNonBlankBefore) {
            return false;
        }
        const line = context.peek(0);
        if (line === null || isBlankLine(line)) {
            // Do not consume blanks here; let BlankLineMatcher handle them
            return false;
        }
        const s = line.trim();
        // Heuristic: RFC metadata usually contains these markers
        return (
            s.includes('Internet Engineering Task Force') ||
            s.startsWith('Request for Comments:') ||
            s.startsWith('Category:')
        );
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];
        // Skip leading blanks at the very top of the document
        while (!context.cursor.isEOL()) {
            const current = context.peek(0);
            if (current === null) {
                break;
            }
            if (!isBlankLine(current)) {
                break;
            }
            context.advance();
        }
        // Capture metadata block until the next blank line
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
