import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {getIndentation} from "../Parser.js";
import type {HttpResponseNode} from "../Node/HttpResponseNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";

// Matches HTTP responses rendered in RFC-like text. Examples:
//   "   HTTP/1.1 302 Found"
//   "   Location: https://..."
//   "           &continued=xyz"    (wrapped header value/URI continuation)
// Or as an indented headers block, optional blank line, then an indented body block.
// Be conservative: require a valid status line followed by at least one header-like line,
// but allow subsequent continuation lines at the same-or-deeper indent even if they do not
// individually match the header pattern (to capture wrapped header values).
const statusLineRegex = /^\s*HTTP\/(?:\d(?:\.\d)?)\s+\d{3}\b.*$/;
const headerLineRegex = /^\s*[A-Za-z0-9][A-Za-z0-9\-]*:\s?.*$/;

export const HttpResponseMatcher: BlockMatcher = {
    name: "httpResponse",
    // Run before IndentedBlock and Paragraph, but after lists/section titles
    priority: 45,
    test: (context) => {
        const first = context.peek(0);
        if (first === null || isBlankLine(first)) {
            return false;
        }
        if (!statusLineRegex.test(first)) {
            return false;
        }
        const second = context.peek(1);
        return second !== null && headerLineRegex.test(second);
    },
    parse: (context) => {
        
        const lines: string[] = [];

        // Establish base indent (align with IndentedBlock's base behavior of min 4)
        const first = context.peek(0)!;
        const firstIndent = getIndentation(first);
        const base = Math.min(4, firstIndent);

        // Consume status line
        lines.push(first);
        context.advance();

        // Collect subsequent header and continuation lines at same-or-deeper indent.
        // Stop at blank line, page boundary, or when indentation drops below base.
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            if (line === null || isBlankLine(line)) {
                break;
            }
            if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                break;
            }
            if (getIndentation(line) < base) {
                break;
            }
            lines.push(line);
            context.advance();
        }

        // Optionally consume a single blank line then a body block that is indented
        // to at least the base indent.
        // Heuristic: Only capture a body if headers indicate a body is present
        // (e.g., Content-Type, Content-Length, Transfer-Encoding) and the status
        // code allows a body (not 1xx, 204, 304). This avoids swallowing narrative
        // text following examples.
        let bodyLines: string[] | undefined = undefined;
        const maybeBlank = context.peek(0);
        if (maybeBlank !== null && isBlankLine(maybeBlank)) {
            // Look ahead to see if a body block follows at same-or-deeper indent
            const afterBlank = context.peek(1);
            if (afterBlank !== null && getIndentation(afterBlank) >= base) {
                const firstLine = lines[0] ?? "";
                const m = firstLine.match(/HTTP\/(?:\d(?:\.\d)?)\s+(\d{3})/);
                let status = NaN;
                if (m && m[1]) {
                    status = parseInt(m[1], 10);
                }
                const statusAllowsBody = !(status >= 100 && status < 200) && status !== 204 && status !== 304;
                const hasBodyHeader = lines.some(l => /\b(Content-Type|Content-Length|Transfer-Encoding)\s*:/i.test(l));

                if (statusAllowsBody && hasBodyHeader) {
                    // consume the blank line here (but do not record it in node; renderer will add one)
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
            type: "HttpResponse",
            lines,
            bodyLines,
            
        } as HttpResponseNode;
    },
};
