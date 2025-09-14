import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, sliceLineText} from "../Parser.js";
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

    // Bracketed text bullets: two cases
    // 1) Marker + at least two spaces + content on the same line
    m = line.match(/^(\s*)(\[[^\]]+\])(\s{2,})(\S.*)$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
        };
    }
    // 2) Marker-only line with no content (allow trailing spaces only)
    m = line.match(/^(\s*)(\[[^\]]+\])\s*$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        return {
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length, // will be reset from next line
            leadingIndent: leading.length,
            markerOnly: true,
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
        // Avoid misclassifying Table of Contents entries (RFC 9700 style)
        // when they appear immediately after a "Table of Contents" heading.
        for (let back = -1; back >= -3; back -= 1) {
            const prev = context.peek(back);
            if (prev === null) { break; }
            if (isBlankLine(prev)) { continue; }
            if ((prev.trim()) === 'Table of Contents') {
                return false;
            }
            break;
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
        
        const items: ListItemNode[] = [];
        let listBaseIndent: number | null = null;
        let listMarkerIndent: number | null = null;

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

            let match = detectListMarker(line);
            // Only allow a new item if the marker aligns to the first
            // item's marker indentation. This avoids misclassifying tokens
            // like "(PKIX)" under the content column as a new item.
            if (match && listMarkerIndent !== null && match.leadingIndent !== listMarkerIndent) {
                match = null;
            }
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
            if (listMarkerIndent === null) {
                listMarkerIndent = match.leadingIndent;
            }

            // Read continuation lines for this item
            // Support multiple paragraphs within a single list item separated by blank lines.
            let previousWasBlank = false;
            let paragraphIndent: number | null = null;
            while (!context.cursor.isEOL()) {
                const continuation = context.peek(0);
                if (continuation === null) {
                    break;
                }
                if (isBlankLine(continuation)) {
                    // Look ahead: decide whether this blank line belongs to a new paragraph
                    // within the current item, or should terminate the item so that a
                    // separate BlankLine node is emitted by the BlankLineMatcher.
                    let k = 1;
                    let nextNonBlank: string | null = null;
                    while (true) {
                        const look = context.peek(k);
                        if (look === null) { break; }
                        if (!isBlankLine(look)) { nextNonBlank = look; break; }
                        k += 1;
                    }
                    if (nextNonBlank === null) {
                        // End of input after blank line — end the item here and let the
                        // outer parser handle the trailing blanks.
                        break;
                    }
                    // If the next non-blank starts a new list item (any style), end here.
                    const nm = detectListMarker(nextNonBlank);
                    if (nm) {
                        break;
                    }
                    // If the next non-blank is sufficiently indented to be a continuation
                    // paragraph of this list item, consume this blank as an intra-item
                    // paragraph separator; otherwise, do not consume it so that a
                    // BlankLine node can be produced between the list and the next block.
                    const nextIndent = getIndentation(nextNonBlank);
                    // Continuation paragraphs within a list item must align with
                    // the item's content column. Do not treat lines indented only
                    // to the marker/base indent (e.g., narrative paragraphs at 3 spaces)
                    // as part of the list item.
                    if (nextIndent >= item.contentIndent) {
                        previousWasBlank = true;
                        paragraphIndent = null;
                        item.lines.push("");
                        context.advance();
                        continue;
                    }
                    // Next block is not a continuation paragraph — end the item without
                    // consuming the blank line.
                    break;
                }
                if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                    break;
                }
                // Stop if a new list marker begins here
                if (detectListMarker(continuation)) {
                    break;
                }

                const contIndent = getIndentation(continuation);
                // If we are in a normal wrapped continuation, require content indent.
                if (contIndent >= item.contentIndent) {
                    item.lines.push(sliceLineText(continuation, item.contentIndent));
                    context.advance();
                    previousWasBlank = false;
                    continue;
                }
                // After a blank line within the item, allow the next paragraph to start
                // at a slightly smaller indent (e.g., RFC styles), and keep consuming
                // lines at that indent as part of the paragraph.
                if ((previousWasBlank || paragraphIndent !== null) && contIndent >= item.contentIndent) {
                    if (paragraphIndent === null) {
                        paragraphIndent = contIndent;
                    }
                    const sliceAt = Math.min(paragraphIndent, contIndent);
                    item.lines.push(sliceLineText(continuation, sliceAt));
                    context.advance();
                    previousWasBlank = false;
                    continue;
                }
                break;
            }
        }

        return {
            type: 'List',
            items,
        } as ListNode;
    },
};
