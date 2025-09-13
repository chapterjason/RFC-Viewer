import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, makePosition} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {AbnfNode} from "../Node/AbnfNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";
import type {BlockContext} from "../BlockContext.js";

// Conservative heuristics to detect ABNF rule blocks in RFC-like text.
// Key signals:
//  - Rule start lines: rulename = elements  or  rulename =/ elements
//  - Comment lines starting with ';'
//  - Common ABNF tokens within a block: %x, %d, %b, DQUOTE strings, '/'

const ruleStartRegex = /^\s*[A-Za-z][A-Za-z0-9-]*\s*=\/?\s+.+$/;
const commentRegex = /^\s*;.*/;
const tokenEvidenceRegex = /(^|\s)%(?:x|d|b)[0-9A-Fa-f]/;

function isBoundary(context: BlockContext): boolean {
    return PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context);
}

function isRuleOrComment(line: string): boolean {
    return ruleStartRegex.test(line) || commentRegex.test(line);
}

function hasAbnfEvidence(line: string): boolean {
    if (isBlankLine(line)) {
        return false;
    }
    if (isRuleOrComment(line)) {
        return true;
    }
    // Look for common ABNF token hints on continuation lines
    const trimmed = line.trim();
    if (tokenEvidenceRegex.test(trimmed)) {
        return true;
    }
    if (/^\/.+/.test(trimmed)) { // alternative continuation starting with '/'
        return true;
    }
    if (/^".*"$/.test(trimmed) || /^".*"\s*(?:\/.+)?$/.test(trimmed)) {
        return true;
    }
    return false;
}

export const AbnfMatcher: BlockMatcher = {
    name: "abnf",
    // Run before IndentedBlock (50) and Paragraph (90), similar to HTTP/Figure
    priority: 46,
    test: (context) => {
        const first = context.peek(0);
        if (first === null || isBlankLine(first)) {
            return false;
        }
        if (!ruleStartRegex.test(first)) {
            return false;
        }

        const base = getIndentation(first);
        let evidence = 0;
        let offset = 0;
        while (true) {
            const line = context.peek(offset);
            if (line === null || isBlankLine(line)) {
                break;
            }
            if (isBoundary(context)) {
                break;
            }
            if (getIndentation(line) < base) {
                break;
            }
            if (hasAbnfEvidence(line)) {
                evidence += 1;
            }
            // Do not scan excessively far
            offset += 1;
            if (offset > 12) {
                break;
            }
        }

        // Accept when the block is indented and we have at least one line of evidence.
        // This enables single-line ABNF rules like "client-id = *VSCHAR" while keeping
        // normal prose (usually flush-left) out.
        return base >= 1 && evidence >= 1;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];
        const first = context.peek(0)!;
        const base = getIndentation(first);

        while (!context.cursor.isEOL()) {
            const s = context.peek(0);
            if (s === null || isBlankLine(s)) {
                break;
            }
            if (isBoundary(context)) {
                break;
            }
            if (getIndentation(s) < base) {
                break;
            }
            // Preserve lines exactly (including indentation and spacing)
            lines.push(s);
            context.advance();
        }

        return {
            type: "Abnf",
            lines,
            position: { start, end: makePosition(context.cursor, 0) }
        } as AbnfNode;
    },
};
