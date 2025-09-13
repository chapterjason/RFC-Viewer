import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, makePosition, sliceLineText} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {ListItemNode, ListNode} from "../Node/ListNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";

interface ListMatch {
    marker: string;
    markerLength: number;
    contentIndent: number;
    leadingIndent: number;
}

function detectListMarker(line: string): ListMatch | null {
    const trimmed = line.trim();
    // Exclude ToC-like entries such as: "1. Intro .......4"
    const looksLikeTocEntry = /\.{2,}\s*\d+\s*$/.test(trimmed);
    if (looksLikeTocEntry) {
        return null;
    }

    // Common bullet: 'o' with at least two spaces after
    let m = line.match(/^(\s*)o(\s{2,})(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const spaces = m[2] ?? '';
        return {
            marker: 'o',
            markerLength: 1,
            contentIndent: leading.length + 1 + spaces.length,
            leadingIndent: leading.length,
        };
    }

    // Asterisk bullet: '*' with at least two spaces after
    m = line.match(/^(\s*)\*(\s{2,})(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const spaces = m[2] ?? '';
        return {
            marker: '*',
            markerLength: 1,
            contentIndent: leading.length + 1 + spaces.length,
            leadingIndent: leading.length,
        };
    }

    // Numbered list: "1." then spaces
    m = line.match(/^(\s*)(\d+\.)(\s+)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
        };
    }

    // Alpha with parentheses: "(A)" then spaces
    m = line.match(/^(\s*)(\([A-Za-z]\))(\s+)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
        };
    }

    // Bracketed text: "[TEXT]" then spaces
    m = line.match(/^(\s*)(\[[^\]]+\])(\s+)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
        };
    }

    return null;
}

export const ListMatcher: BlockMatcher = {
    name: "list",
    // Run before SectionTitle and IndentedBlock/Paragraph
    priority: 35,
    test: (context) => {
        const line = context.peek(0);
        if (line === null || isBlankLine(line)) {
            return false;
        }
        return detectListMarker(line) !== null;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const items: ListItemNode[] = [];

        // Establish base indentation from the first item
        const firstLine = context.peek(0)!;
        const firstMatch = detectListMarker(firstLine)!;
        const listBaseIndent = Math.min(getIndentation(firstLine), firstMatch.contentIndent);

        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            if (line === null) {
                break;
            }
            if (isBlankLine(line)) {
                break; // stop, let BlankLineMatcher handle it
            }
            if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                break;
            }

            const match = detectListMarker(line);
            if (!match) {
                // Not a new list item — if this line is indented to at least the
                // current item's content indent, treat it as a continuation line;
                // otherwise, end the list.
                const currentItem = items[items.length - 1];
                if (!currentItem) {
                    break;
                }
                const indentation = getIndentation(line);
                if (indentation >= currentItem.contentIndent) {
                    currentItem.lines.push(sliceLineText(line, currentItem.contentIndent));
                    context.advance();
                    continue;
                }
                break;
            }

            // New list item
            // Enforce that list does not jump to a smaller base indent (likely a new block)
            if (match.contentIndent < listBaseIndent) {
                break;
            }

            const item: ListItemNode = {
                marker: match.marker,
                contentIndent: match.contentIndent,
                markerIndent: match.leadingIndent,
                lines: [],
            };
            // Push the first content line (after marker and required spaces)
            item.lines.push(sliceLineText(line, match.contentIndent));
            items.push(item);
            context.advance();

            // Read continuation lines for this item
            while (!context.cursor.isEOL()) {
                const continuation = context.peek(0);
                if (continuation === null) {
                    break;
                }
                if (isBlankLine(continuation)) {
                    break;
                }
                if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                    break;
                }
                // Stop if a new list marker begins here
                if (detectListMarker(continuation)) {
                    break;
                }

                if (getIndentation(continuation) >= item.contentIndent) {
                    item.lines.push(sliceLineText(continuation, item.contentIndent));
                    context.advance();
                    continue;
                }
                break;
            }
        }

        return {
            type: 'List',
            items,
            position: {start, end: makePosition(context.cursor, 0)},
        } as ListNode;
    },
};
