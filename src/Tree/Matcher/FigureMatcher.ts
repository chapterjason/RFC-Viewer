import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {FigureNode} from "../Node/FigureNode.js";

function isDiagramLine(line: string): boolean {
    if (isBlankLine(line)) {
        return false;
    }
    // Heuristic: diagram lines in RFCs typically include vertical bars, box borders,
    // or arrow-like connectors. Allow words inside boxes without rejecting them.
    // Also allow standalone label lines like "(A)", "(B)", etc., which often precede boxes.
    if (/^\s*\([A-Za-z0-9]+\)\s*$/.test(line)) {
        return true;
    }
    if (/[|]/.test(line)) {
        return true;
    }
    if (/\+[\-+]{2,}\+/.test(line)) {
        return true;
    }
    if (/<-+|-+>|\^|\bv\b/.test(line)) {
        return true;
    }
    return false;
}

function isDiagramAnnotationLine(line: string): boolean {
    // Accept inline annotation lines commonly found inside RFC figures, e.g.:
    // "(A) (G) Access Token" or just "(A)" with indentation.
    // Keep this relatively strict to avoid false positives in normal prose.
    if (isBlankLine(line)) {
        return false;
    }
    const trimmed = line.trim();
    // Must start with one or more parenthesized labels
    if (!/^\((?:[A-Za-z0-9]+)\)(?:\s*\([A-Za-z0-9]+\))*[\sA-Za-z0-9\-]*$/.test(trimmed)) {
        return false;
    }
    // Require at least some leading indentation to tie it to the diagram region
    if (/^\S/.test(line)) {
        return false;
    }
    return true;
}

function isFigureCaption(line: string): boolean {
    if (line === null) {
        return false;
    }
    const trimmed = line.replace(/^\s+/, "");
    return /^Figure\s+\d+\s*:/.test(trimmed);
}

function isNoteStart(line: string): boolean {
    if (line === null) {
        return false;
    }
    const trimmed = line.replace(/^\s+/, "");
    return /^Note:/.test(trimmed);
}

export const FigureMatcher: BlockMatcher = {
    name: "figure",
    // Before IndentedBlock (50) and Paragraph (90) to capture diagrams reliably
    priority: 45,
    test: (context) => {
        const line0 = context.peek(0);
        if (line0 === null) {
            return false;
        }
        // Require at least 3 consecutive diagram-like lines to reduce false positives
        let count = 0;
        let offset = 0;
        while (true) {
            const line = context.peek(offset);
            if (line === null || isBlankLine(line)) {
                break;
            }
            if (!isDiagramLine(line)) {
                break;
            }
            count += 1;
            offset += 1;
            if (count >= 3) {
                return true;
            }
            // Guard: do not scan excessively
            if (offset > 20) {
                break;
            }
        }
        return false;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];

        // 1) Read diagram block (consecutive non-blank diagram-like lines)
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            if (line === null || isBlankLine(line)) {
                break;
            }
            // Do not consume caption or note as part of the raw diagram
            if (isFigureCaption(line) || isNoteStart(line)) {
                break;
            }
            if (!isDiagramLine(line) && !isDiagramAnnotationLine(line)) {
                break;
            }
            lines.push(line);
            context.advance();
        }

        // 2) Capture blank lines directly after the diagram (preserve exact count)
        let blanksAfterDiagram = 0;
        while (!context.cursor.isEOL() && isBlankLine(context.peek(0))) {
            lines.push(context.peek(0)!);
            context.advance();
            blanksAfterDiagram += 1;
        }

        // 3) Optional Note paragraph right after diagram
        if (!context.cursor.isEOL() && isNoteStart(context.peek(0)!)) {
            // Read until a blank line
            while (!context.cursor.isEOL()) {
                const line = context.peek(0);
                if (line === null) {
                    break;
                }
                if (isBlankLine(line)) {
                    break;
                }
                lines.push(line);
                context.advance();
            }
            // Preserve blank lines after note
            while (!context.cursor.isEOL() && isBlankLine(context.peek(0))) {
                lines.push(context.peek(0)!);
                context.advance();
            }
        } else {
            // If there were no blanks after the diagram (rare), do not try to consume note/caption
            // but still proceed to check caption below without relying on blanks.
        }

        // 4) Optional Figure caption
        if (!context.cursor.isEOL() && isFigureCaption(context.peek(0)!)) {
            lines.push(context.peek(0)!);
            context.advance();
        }

        return {
            type: "Figure",
            lines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as FigureNode;
    },
};
