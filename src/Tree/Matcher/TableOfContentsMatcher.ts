import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation} from "../Parser.js";
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

function hasRecentTocHeading(context: any): boolean {
    // Check up to the previous 3 lines for a non-blank "Table of Contents" heading
    for (let back = -1; back >= -3; back -= 1) {
        const prev = context.peek(back);
        if (prev === null) { break; }
        if (isBlankLine(prev)) { continue; }
        if (prev.trim() === 'Table of Contents') {
            return true;
        }
        // First non-blank is not the heading
        break;
    }
    return false;
}

function parseTocEntryFromLines(lines: string[]): TableOfContentsEntry {
    const first = lines[0] ?? '';
    const indent = getIndentation(first);
    const last = lines[lines.length - 1] ?? '';
    // Special-case single-line entries to avoid duplicate titles
    if (lines.length === 1) {
        let page: number | null = null;
        let soleTitle = last;
        const m1 = last.match(/(\.{2,})\s*(\d+)\s*$/);
        if (m1) {
            const cutIndex = last.lastIndexOf(m1[0]);
            soleTitle = last.slice(0, Math.max(cutIndex, 0)).trimEnd();
            const num = parseInt(m1[2] ?? '', 10);
            page = Number.isNaN(num) ? null : num;
        }
        const title = (soleTitle ?? '').replace(/\s{2,}/g, ' ').trim() || null;
        return {
            raw: lines.join('\n'),
            indent,
            title,
            page,
        };
    }

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
        // Path A: classic style with dot leaders (same or next lines)
        for (let offset = 0; offset <= 2; offset += 1) {
            const next = context.peek(offset);
            if (next === null || isBlankLine(next)) { break; }
            if (isLeaderLine(next)) { return true; }
        }
        // Path B: RFC 9700 style — no leaders, but immediately after a
        // "Table of Contents" heading and followed by additional numbered entries.
        if (!hasRecentTocHeading(context)) {
            return false;
        }
        // Ensure there is at least one more ToC start shortly after the current line
        let foundStarts = 1; // current line
        for (let look = 1; look <= 6; look += 1) {
            const n = context.peek(look);
            if (n === null) { break; }
            if (isBlankLine(n)) { break; }
            if (isPotentialTocStart(n)) {
                foundStarts += 1;
                if (foundStarts >= 2) { return true; }
                continue;
            }
            // Allow wrapped title continuations that are further indented
            const currIndent = getIndentation(context.peek(0) ?? '');
            if (getIndentation(n) > currIndent) { continue; }
            break;
        }
        return false;
    },
    parse: (context) => {
        const lines: string[] = [];
        const entries: TableOfContentsEntry[] = [];
        // Track the minimum indentation among detected ToC entries
        let minEntryIndent: number | null = null;
        while (!context.cursor.isEOL()) {
            const current = context.peek(0);
            if (current === null || isBlankLine(current)) {
                break;
            }
            if (!isLeaderLine(current) && !isPotentialTocStart(current)) {
                // After ToC entries have begun, include unnumbered tail lines
                // if they share the same lowest indentation.
                const indent = getIndentation(current);
                const trimmed = current.trim();
                if (entries.length > 0 && minEntryIndent !== null &&
                    indent === minEntryIndent && trimmed.length > 0 &&
                    /^[A-Za-z]/.test(trimmed) && !leaderLineRegex.test(current)) {
                    const entryLines = [current];
                    lines.push(current);
                    context.advance();
                    entries.push(parseTocEntryFromLines(entryLines));
                    continue;
                }
                break;
            }

            const entryLines: string[] = [];
            if (isLeaderLine(current)) {
                // Single-line entry that already has leaders
                entryLines.push(current);
                lines.push(current);
                const indent = getIndentation(current);
                minEntryIndent = (minEntryIndent === null) ? indent : Math.min(minEntryIndent, indent);
                context.advance();
            } else {
                // Wrapped entry: start, optional continuations, then leader line
                const startIndent = getIndentation(current);
                minEntryIndent = (minEntryIndent === null) ? startIndent : Math.min(minEntryIndent, startIndent);
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
        } as TableOfContentsNode;
    },
};
