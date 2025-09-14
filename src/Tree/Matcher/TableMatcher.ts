import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {TableNode} from "../Node/TableNode.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";

function isTableBorderLine(text: string): boolean {
    if (isBlankLine(text)) {
        return false;
    }
    // Accept borders like "+======+-----+===+" (mixture of '=' and '-')
    // Require at least two '+' (multiple columns) and a run of '-' or '=' between them
    const trimmed = text.trimStart();
    if (!trimmed.startsWith("+") || !trimmed.endsWith("+")) {
        return /\+[=\-]{2,}\+/.test(trimmed);
    }
    return /\+[=\-]+(?:\+[=\-]+)+\+/.test(trimmed);
}

function isTableRowLine(text: string): boolean {
    if (isBlankLine(text)) {
        return false;
    }
    // Lines with '|' column separators; require at least two pipes
    const trimmed = text.trimStart();
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    if (pipeCount < 2) {
        return false;
    }
    // Be conservative: avoid matching ordinary prose with a single '|' accidentally; already ensured >=2
    return true;
}

function isTableCaption(text: string): boolean {
    if (text == null) {
        return false;
    }
    const trimmed = text.replace(/^\s+/, "");
    // RFC style: "Table 1: Caption text"
    return /^Table\s+\d+\s*:/.test(trimmed);
}

export const TableMatcher: BlockMatcher = {
    name: "table",
    // Run before Figure (45), IndentedBlock (50), and Paragraph (90)
    priority: 44,
    test: (context) => {
        const l0 = context.peek(0);
        if (l0 === null || isBlankLine(l0)) {
            return false;
        }
        // RFC narrative uses 3-space paragraphs; some tables also start at 3 spaces.
        // Accept tables starting at indent >= 3.
        if (getIndentation(l0) < 3) {
            return false;
        }

        // Heuristic: need at least 3 table-like lines (border/row/border)
        let count = 0;
        let offset = 0;
        while (true) {
            const line = context.peek(offset);
            if (line === null || isBlankLine(line)) {
                break;
            }
            const indent = getIndentation(line);
            if (indent < 3) {
                break;
            }
            if (!(isTableBorderLine(line) || isTableRowLine(line))) {
                break;
            }
            count += 1;
            offset += 1;
            if (count >= 3) {
                return true;
            }
            if (offset > 40) {
                break;
            }
        }
        return false;
    },
    parse: (context) => {
        const tableLines: string[] = [];
        const first = context.peek(0)!;
        const base = Math.min(4, getIndentation(first));

        // 1) Consume consecutive table lines (borders or rows) at >= base indent
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            if (line === null || isBlankLine(line)) {
                break;
            }
            const indent = getIndentation(line);
            if (indent < base) {
                break;
            }
            if (!(isTableBorderLine(line) || isTableRowLine(line))) {
                break;
            }
            tableLines.push(sliceLineText(line, base));
            context.advance();
        }

        // 2) Preserve blank lines directly after the table (as empty strings)
        while (!context.cursor.isEOL() && isBlankLine(context.peek(0))) {
            tableLines.push("");
            context.advance();
        }

        // 3) Optional single-line caption immediately after (at >= base indent)
        if (!context.cursor.isEOL()) {
            const cap = context.peek(0)!;
            if (getIndentation(cap) >= base && isTableCaption(cap)) {
                tableLines.push(sliceLineText(cap, base));
                context.advance();
            }
        }

        return {
            type: "Table",
            indent: base,
            lines: tableLines,
        } as TableNode;
    },
};
