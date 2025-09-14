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
// Be conservative: require a plausible METHOD line and an HTTP/x token
// within the first request lines (to avoid false positives from narrative
// paragraphs that contain words followed by a colon, e.g., "clients:").
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

        // Look ahead only a small distance through the contiguous indented group
        // to find an HTTP/x token as evidence of a real request. Do NOT rely on
        // header-like lines alone, which can appear in normal prose (e.g., "clients:").
        const base = getIndentation(first);
        if (httpTokenRegex.test(first)) {
            return true;
        }
        let index = 1;
        let hops = 0;
        const MAX_LOOKAHEAD = 6; // allow deeper wrapped request-target before HTTP token
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
            // Bound the lookahead to avoid scanning deep into narrative paragraphs
            hops += 1;
            if (httpTokenRegex.test(line)) {
                return true;
            }
            if (hops >= MAX_LOOKAHEAD) {
                break;
            }
            index += 1;
        }
        return false;
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

        // Optional blank line + body block at same-or-deeper indent.
        // Heuristic: For requests using typically body-less methods (e.g., GET, HEAD, TRACE),
        // only treat the following indented block as a body if headers indicate a body
        // (e.g., Content-Type, Content-Length, Transfer-Encoding). This avoids swallowing
        // narrative paragraphs that are written at the same indent as the example.
        let bodyLines: string[] | undefined = undefined;
        const maybeBlank = context.peek(0);
        if (maybeBlank !== null && isBlankLine(maybeBlank)) {
            const afterBlank = context.peek(1);
            if (afterBlank !== null && getIndentation(afterBlank) >= base) {
                // Decide if we should consider a body for this request
                const firstLine = lines[0] ?? "";
                const methodMatch = firstLine.trim().match(/^([A-Z!#$%&'*+.^_`|~-]+)/);
                const method = methodMatch ? methodMatch[1] : "";
                const likelyBodyless = method === "GET" || method === "HEAD" || method === "TRACE";
                const hasBodyHeader = lines.some(l => /\b(Content-Type|Content-Length|Transfer-Encoding)\s*:/i.test(l));

                if (!likelyBodyless || hasBodyHeader) {
                    // consume the blank and collect the body block
                    context.advance();
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
        }

        return {
            type: "HttpRequest",
            lines,
            bodyLines,
            position: {start, end: makePosition(context.cursor, 0)}
        } as HttpRequestNode;
    },
};
