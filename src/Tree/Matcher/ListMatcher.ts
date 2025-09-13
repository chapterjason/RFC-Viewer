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
    markerOnly?: boolean;
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

    // Alpha/ID with parentheses: "(A)" or "(W3C.REC-...)" then spaces
    m = line.match(/^(\s*)(\([A-Za-z0-9][A-Za-z0-9.\-]*\))(\s+)(\S.*)?$/);
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

    // Bracketed text: "[TEXT]" then optional spaces and optional content
    m = line.match(/^(\s*)(\[[^\]]+\])(\s*)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        const hasContent = (m[4] ?? '').length > 0;
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
            markerOnly: !hasContent && spaces.length === 0,
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
        const match = detectListMarker(line);
        if (!match) {
            return false;
        }
        // Avoid misclassifying top-level numeric section headings like
        // "1. Introduction" as lists. If the marker is purely numeric (e.g.,
        // "1.") at indent 0 and the next line is blank or an indented
        // continuation (not another list item), prefer letting SectionTitle
        // handle it by returning false here.
        const isPureNumericMarker = /^\d+\.$/.test(match.marker);
        if (isPureNumericMarker && match.leadingIndent === 0) {
            const next = context.peek(1);
            if (next === null || isBlankLine(next)) {
                return false;
            }
            // If the next line is indented and not a new list marker, treat as
            // a wrapped section title rather than a list.
            const nextIsList = detectListMarker(next) !== null;
            if (!nextIsList) {
                const nextIndent = getIndentation(next);
                if (nextIndent > 0) {
                    return false;
                }
            }
        }
        return true;
    },
    parse: (context) => {
        const start = makePosition(context.cursor, 0);
        const items: ListItemNode[] = [];
        let listBaseIndent: number | null = null;

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
            if (listBaseIndent !== null && match.contentIndent < listBaseIndent) {
                break;
            }

            const item: ListItemNode = {
                marker: match.marker,
                contentIndent: match.contentIndent,
                markerIndent: match.leadingIndent,
                lines: [],
                markerOnly: Boolean(match.markerOnly),
            };
            const originalLine = line;
            const firstContent = sliceLineText(originalLine, match.contentIndent);
            if (!match.markerOnly && firstContent.length > 0) {
                item.lines.push(firstContent);
                context.advance();
            } else {
                // Marker-only line: determine content indent from next line and use it as first content
                context.advance();
                const nextLine = context.peek(0);
                if (nextLine !== null && !isBlankLine(nextLine)) {
                    const nextIndent = getIndentation(nextLine);
                    item.contentIndent = nextIndent;
                    item.lines.push(sliceLineText(nextLine, item.contentIndent));
                    context.advance();
                }
            }
            items.push(item);

            if (listBaseIndent === null) {
                listBaseIndent = Math.min(getIndentation(originalLine), item.contentIndent);
            }

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
