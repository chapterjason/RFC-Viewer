import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {MetadataNode} from "../Node/MetadataNode.js";
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

        // Heuristic: Look ahead a few lines at the very top for common RFC
        // metadata markers. Some RFCs start with "Network Working Group"
        // rather than explicitly mentioning IETF on the first line, and the
        // mandatory markers (e.g., Request for Comments, Category) may appear
        // on subsequent lines.
        const maxLookahead = 8;
        for (let index = 0; index < maxLookahead; index++) {
            const lookahead = context.peek(index);
            if (lookahead === null) {
                break;
            }

            if (isBlankLine(lookahead)) {
                // Stop at the first blank; metadata block is contiguous
                break;
            }

            const text = lookahead.trim();

            if (
                text.includes('Internet Engineering Task Force') ||
                text.includes('Internet Architecture Board') ||
                text.includes('Internet Research Task Force') ||
                text.includes('Independent Submission') ||
                text.startsWith('Network Working Group') ||
                text.startsWith('Request for Comments:') ||
                text.startsWith('Category:') ||
                text.startsWith('Obsoletes:') ||
                text.startsWith('Updates:')
            ) {
                return true;
            }
        }

        return false;
    },
    parse: (context) => {
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
        } as MetadataNode;
    },
};
