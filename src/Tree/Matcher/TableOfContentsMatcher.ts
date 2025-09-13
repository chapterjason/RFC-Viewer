import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {TableOfContentsEntry, TableOfContentsNode} from "../Node/TableOfContentsNode.js";

// Leader line ends with dot leaders followed by a page number
const leaderLineRegex = /\.{2,}\s*\d+\s*$/;
// Numbered start like: "1." or "10.16." then space and text
const numberedStartRegex = /^\s*\d+(?:\.\d+)*\.\s+\S/;
// Appendix start like: "Appendix A." (relaxed)
const appendixStartRegex = /^\s*Appendix\s+[A-Za-z]+\.?\s+\S/;

function isLeaderLine(line: string): boolean {
    return leaderLineRegex.test(line);
}

function isPotentialTocStart(line: string): boolean {
    return numberedStartRegex.test(line) || appendixStartRegex.test(line);
}

function parseTocEntryFromLines(lines: string[]): TableOfContentsEntry {
    const first = lines[0] ?? '';
    const indent = getIndentation(first);
    const last = lines[lines.length - 1] ?? '';
    let page: number | null = null;
    let lastTitle = last;
    const m = last.match(/(\.{2,})\s*(\d+)\s*$/);
    if (m) {
        const cutIndex = last.lastIndexOf(m[0]);
        lastTitle = last.slice(0, Math.max(cutIndex, 0)).trimEnd();
        const num = parseInt(m[2] ?? '', 10);
        page = Number.isNaN(num) ? null : num;
    }
    const titleParts = [first, ...lines.slice(1, -1), lastTitle].map((s) => s.trimEnd());
    const title = titleParts.join(' ').replace(/\s{2,}/g, ' ').trim() || null;
    return {
        raw: lines.join('\n'),
        indent,
        title,
        page,
    };
}

export const TableOfContentsMatcher: BlockMatcher = {
    name: 'tableOfContents',
    // After SectionTitle (40), before IndentedBlock (50)/Paragraph (90)
    priority: 45,
    test: (context) => {
        const line = context.peek(0);
        if (line === null || isBlankLine(line)) {
            return false;
        }
        if (isLeaderLine(line)) {
            return true;
        }
        if (!isPotentialTocStart(line)) {
            return false;
        }
        // Look ahead up to 2 lines for a leader line to confirm ToC wrap
        for (let offset = 1; offset <= 2; offset += 1) {
            const next = context.peek(offset);
            if (next === null || isBlankLine(next)) {
                break;
            }
            if (isLeaderLine(next)) {
                return true;
            }
        }
        return false;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];
        const entries: TableOfContentsEntry[] = [];
        while (!context.cursor.isEOL()) {
            const current = context.peek(0);
            if (current === null || isBlankLine(current)) {
                break;
            }
            if (!isLeaderLine(current) && !isPotentialTocStart(current)) {
                break;
            }

            const entryLines: string[] = [];
            if (isLeaderLine(current)) {
                // Single-line entry that already has leaders
                entryLines.push(current);
                lines.push(current);
                context.advance();
            } else {
                // Wrapped entry: start, optional continuations, then leader line
                const startIndent = getIndentation(current);
                entryLines.push(current);
                lines.push(current);
                context.advance();
                while (!context.cursor.isEOL()) {
                    const next = context.peek(0);
                    if (next === null || isBlankLine(next)) {
                        break;
                    }
                    if (isLeaderLine(next)) {
                        entryLines.push(next);
                        lines.push(next);
                        context.advance();
                        break;
                    }
                    if (getIndentation(next) > startIndent) {
                        entryLines.push(next);
                        lines.push(next);
                        context.advance();
                        continue;
                    }
                    break;
                }
            }

            if (entryLines.length > 0) {
                entries.push(parseTocEntryFromLines(entryLines));
            }
        }
        return {
            type: 'TableOfContents',
            lines,
            entries,
            position: {start, end: makePosition(context.cursor, 0)},
        } as TableOfContentsNode;
    },
};
