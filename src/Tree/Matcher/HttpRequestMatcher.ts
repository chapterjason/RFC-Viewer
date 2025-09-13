import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {getIndentation, makePosition} from "../Parser.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";
import type {HttpRequestNode} from "../Node/HttpRequestNode.js";

// Matches HTTP requests rendered in RFC-like text. Examples:
//   "    GET /path?query HTTP/1.1"
//   "        &continued=1 HTTP/1.1"
//   "    Host: example.com"
// Or headers block, blank line, and an indented body block.
// Be conservative: require a plausible METHOD line and either an HTTP/x token
// within the first request lines or at least one header-like line after.
// METHOD token pattern: allow standard tchar, but bias toward uppercase letters and hyphens.
const methodLineRegex = /^\s*[A-Z!#$%&'*+.^_`|~-]+\s+\S.*$/;
const httpTokenRegex = /\bHTTP\/(?:\d(?:\.\d)?)\b/;
const headerLineRegex = /^\s*[A-Za-z0-9][A-Za-z0-9\-]*:\s?.*$/;

export const HttpRequestMatcher: BlockMatcher = {
    name: "httpRequest",
    // Run before IndentedBlock and Paragraph, similar to HttpResponse
    priority: 45,
    test: (context) => {
        const first = context.peek(0);
        if (first === null || isBlankLine(first)) {
            return false;
        }
        if (!methodLineRegex.test(first)) {
            return false;
        }

        // Look ahead through the contiguous indented group to find evidence
        // of a real request (HTTP/x token or a header-like line).
        const base = getIndentation(first);
        let sawEvidence = httpTokenRegex.test(first);
        let index = 1;
        while (true) {
            const line = context.peek(index);
            if (line === null || isBlankLine(line)) {
                break;
            }
            if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                break;
            }
            if (getIndentation(line) < base) {
                break;
            }
            if (headerLineRegex.test(line) || httpTokenRegex.test(line)) {
                sawEvidence = true;
                break;
            }
            index += 1;
        }
        return sawEvidence;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const lines: string[] = [];

        const first = context.peek(0)!;
        const firstIndent = getIndentation(first);
        const base = Math.min(4, firstIndent);

        // Consume request/start and header-like lines until blank/boundary
        while (!context.cursor.isEOL()) {
            const s = context.peek(0);
            if (s === null || isBlankLine(s)) {
                break;
            }
            if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                break;
            }
            if (getIndentation(s) < base) {
                break;
            }
            lines.push(s);
            context.advance();
        }

        // Optional blank line + body block at same-or-deeper indent
        let bodyLines: string[] | undefined = undefined;
        const maybeBlank = context.peek(0);
        if (maybeBlank !== null && isBlankLine(maybeBlank)) {
            const afterBlank = context.peek(1);
            if (afterBlank !== null && getIndentation(afterBlank) >= base) {
                context.advance(); // consume the blank
                bodyLines = [];
                while (!context.cursor.isEOL()) {
                    const line = context.peek(0);
                    if (line === null) { break; }
                    if (isBlankLine(line)) { break; }
                    if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) { break; }
                    const indent = getIndentation(line);
                    if (indent < base) { break; }
                    bodyLines.push(line);
                    context.advance();
                }
            }
        }

        return {
            type: "HttpRequest",
            lines,
            bodyLines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as HttpRequestNode;
    },
};

