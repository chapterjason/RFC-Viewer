import {isBlankLine} from "../../Utils/IsBlankLine.js";
import {getIndentation, sliceLineText} from "../Parser.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {DefinitionItemNode, DefinitionListNode} from "../Node/DefinitionListNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";
import {ListMatcher} from "./ListMatcher.js";

function isTermLine(line: string, next: string | null, allowDeep = false): boolean {
    if (line === null || isBlankLine(line)) {
        return false;
    }
    if (next === null || isBlankLine(next)) {
        return false;
    }
    const termIndent = getIndentation(line);
    const nextIndent = getIndentation(next);
    if (termIndent < 2) {
        return false;
    }
    // Prefer IndentedBlock for deeper indents (>= 4)
    if (!allowDeep && termIndent >= 4) {
        const nextIndent = getIndentation(next);
        if (nextIndent - termIndent < 4) {
            return false;
        }
    }
    if (nextIndent <= termIndent) {
        return false;
    }
    // Require at least 2 more spaces to avoid false positives
    if (nextIndent < termIndent + 2) {
        return false;
    }
    const trimmed = line.trimEnd();
    // Avoid common non-term patterns
    if (/\.{2,}\s*\d+\s*$/.test(trimmed)) {
        return false; // looks like ToC
    }
    // Allow trailing ':' for template-style terms (e.g., "Error name:")
    if (/[.;]$/.test(trimmed)) {
        return false; // likely a sentence, not a term
    }
    if (/:$/.test(trimmed)) {
        const body = trimmed.slice(0, -1);
        // Reject colon-terminated lines that look like sentences (contain a period)
        if (body.includes('.')) {
            return false;
        }
    }
    // Exclude obvious non-term technical lines (URLs, HTTP methods, paths, params)
    // Do not exclude ':' to allow template-style terms
    if (/[\/?&=]/.test(trimmed)) {
        return false;
    }
    // Avoid list markers
    if (ListMatcher.test({
        cursor: {peek: (o: number) => (o === 0 ? line : next)} as any,
        peek: (o: number) => (o === 0 ? line : next),
        advance: () => {},
        state: {seenMetadata: false, seenTitle: false},
    } as any)) {
        return false;
    }
    return true;
}

export const DefinitionListMatcher: BlockMatcher = {
    name: 'definitionList',
    // After List (35), before SectionTitle (40)? Section titles are at col 0 so not conflicting.
    // Ensure before IndentedBlock (50) and Paragraph (90).
    priority: 38,
    test: (context) => {
        const line = context.peek(0);
        const next = context.peek(1);
        if (line === null || next === null) {
            return false;
        }
        if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
            return false;
        }
        return isTermLine(line, next, false);
    },
    parse: (context) => {
        const items: DefinitionItemNode[] = [];

        // Establish base term indentation from first item
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            const next = context.peek(1);
            if (line === null || next === null) {
                break;
            }
            if (!isTermLine(line, next)) {
                break;
            }

            const termIndent = getIndentation(line);
            const definitionIndent = getIndentation(next);
            const term = sliceLineText(line, termIndent);
            const item: DefinitionItemNode = {
                term,
                termIndent,
                definitionIndent,
                lines: [],
            };
            // Consume term line
            context.advance();

            // Consume definition lines indented to definitionIndent or more
            while (!context.cursor.isEOL()) {
                const defLine = context.peek(0);
                const defNext = context.peek(1);
                if (defLine === null || isBlankLine(defLine)) {
                    break; // let blank line matcher handle separation
                }
                if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                    break;
                }
                const indent = getIndentation(defLine);
                // Stop definition block if a deeper potential term begins (nested list)
                if (defNext !== null && isTermLine(defLine, defNext, true) && indent >= definitionIndent) {
                    break;
                }
                if (indent >= definitionIndent) {
                    item.lines.push(sliceLineText(defLine, definitionIndent));
                    context.advance();
                    continue;
                }
                break;
            }

            // Parse nested definition items if the next term is deeper-indented
            const childItems: DefinitionItemNode[] = [];
            while (!context.cursor.isEOL()) {
                const childTerm = context.peek(0);
                const childNext = context.peek(1);
                if (childTerm === null || childNext === null) {
                    break;
                }
                if (isBlankLine(childTerm)) {
                    break;
                }
                if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                    break;
                }
                if (!isTermLine(childTerm, childNext, true)) {
                    break;
                }
                const childTermIndent = getIndentation(childTerm);
                if (childTermIndent < definitionIndent) {
                    break; // not deeper than current item's definition
                }
                const childDefinitionIndent = getIndentation(childNext);
                const child: DefinitionItemNode = {
                    term: sliceLineText(childTerm, childTermIndent),
                    termIndent: childTermIndent,
                    definitionIndent: childDefinitionIndent,
                    lines: [],
                };
                // consume child term line
                context.advance();
                while (!context.cursor.isEOL()) {
                    const l = context.peek(0);
                    if (l === null || isBlankLine(l)) {
                        break;
                    }
                    if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
                        break;
                    }
                    const ind = getIndentation(l);
                    if (ind >= childDefinitionIndent) {
                        child.lines.push(sliceLineText(l, childDefinitionIndent));
                        context.advance();
                        continue;
                    }
                    break;
                }
                childItems.push(child);
                // Continue only if another child term begins (checked at top of loop)
            }
            if (childItems.length > 0) {
                item.children = childItems;
            }
            items.push(item);

            // Continue parsing subsequent items only if a new term begins
            const after = context.peek(0);
            const afterNext = context.peek(1);
            if (after === null || afterNext === null) {
                break;
            }
            if (!isTermLine(after, afterNext)) {
                break;
            }
        }

        return {
            type: 'DefinitionList',
            items,
        } as DefinitionListNode;
    },
};
