import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {SectionTitleNode} from "../Node/SectionTitleNode.js";

export const SectionTitleMatcher: BlockMatcher = {
    name: "sectionTitle",
    priority: 40,
    test: (context) => {
        const line = context.peek(0);
        if (line === null) {
            return false;
        }
        if (isBlankLine(line)) {
            return false;
        }
        // Detect section titles by starting at column 0 only
        if (getIndentation(line) !== 0) {
            return false;
        }
        // Exclude Table of Contents entries like: "1. Intro .......4"
        const trimmed = line.trim();
        const looksLikeTocEntry = /\.{2,}\s*\d+\s*$/.test(trimmed);
        if (looksLikeTocEntry) {
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
        return {
            type: "SectionTitle",
            lines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as SectionTitleNode;
    },
};
