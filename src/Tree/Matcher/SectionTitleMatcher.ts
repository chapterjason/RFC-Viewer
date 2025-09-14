import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation} from "../Parser.js";
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
        const trimmed = line.trim();
        // Exclude Table of Contents entries like: "1. Intro .......4"
        const looksLikeTocEntry = /\.{2,}\s*\d+\s*$/.test(trimmed);
        if (looksLikeTocEntry) {
            return false;
        }
        // Always accept the canonical ToC heading
        if (trimmed === 'Table of Contents') {
            return true;
        }
        // Heuristic: treat a single top-level line as a section title if it
        // is followed by a blank line (standalone heading), or if the next
        // line is indented (wrapped heading continuation). However, avoid
        // swallowing indented ABNF blocks as continuations.
        const next = context.peek(1);
        if (next === null || isBlankLine(next)) {
            return true;
        }
        const nextIndent = getIndentation(next);
        if (nextIndent > 0) {
            // If the next line looks like an ABNF rule start, do not classify
            // the current line as a SectionTitle so that AbnfMatcher can run.
            const ruleStartRegex = /^\s*[A-Za-z][A-Za-z0-9-]*\s*=\/?\s+.+$/;
            if (ruleStartRegex.test(next)) {
                return false;
            }
            return true;
        }
        return false;
    },
    parse: (context) => {
        
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
        } as SectionTitleNode;
    },
};
