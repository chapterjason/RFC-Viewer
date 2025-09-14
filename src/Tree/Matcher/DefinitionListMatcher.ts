import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {DefinitionItemNode, DefinitionListNode} from "../Node/DefinitionListNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";
import {ListMatcher} from "./ListMatcher.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";

// Basic ABNF rule start to avoid misclassifying ABNF as DefinitionList
const abnfRuleStartRegex = /^\s*[A-Za-z][A-Za-z0-9-]*\s*=\/?\s+.+$/;
// ToC-like starts to avoid misclassifying numbered/appendix lines as DefinitionList
const tocNumberedStartRegex = /^\s*\d+(?:\.\d+)*\.\s+\S/;
const tocAppendixStartRegex = /^\s*Appendix\s+[A-Za-z]+\.?\s+\S/;

// Detect a single-line definition where the term and definition share the same line,
// separated by two or more spaces. Returns structure with computed columns or null.
function splitInlineColumns(line: string): {
    termIndent: number;
    termText: string;
    defIndent: number;
    defText: string;
} | null {
    if (line === null || isBlankLine(line)) {
        return null;
    }
    // Avoid ABNF and obvious non-term patterns
    if (abnfRuleStartRegex.test(line)) {
        return null;
    }
    const trimmedRight = line.trimEnd();
    if (/\.{2,}\s*\d+\s*$/.test(trimmedRight)) {
        return null; // likely a ToC entry
    }
    if (/https?:\/\//i.test(trimmedRight)) {
        return null; // URL-like content
    }
    const termIndent = getIndentation(line);
    if (termIndent < 2) {
        return null;
    }
    // Avoid Table of Contents entries
    if (tocNumberedStartRegex.test(line) || tocAppendixStartRegex.test(line)) {
        return null;
    }

    const raw = sliceLineText(line, termIndent);
    const m = raw.match(/^(\S.*?)(\s{2,})(\S.*)$/);
    if (!m) {
        return null;
    }
    const termText = m[1]!;
    const gap = m[2]!;
    const defText = m[3]!;
    // Heuristic: restrict to single-token terms to avoid splitting narrative sentences
    if (termText.includes(' ')) {
        return null;
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(termText)) {
        return null;
    }
    const defIndent = termIndent + termText.length + gap.length;
    return {termIndent, termText, defIndent, defText};
}

function isTermLine(line: string, next: string | null, allowDeep = false): boolean {
    if (line === null || isBlankLine(line)) {
        return false;
    }
    if (next === null || isBlankLine(next)) {
        return false;
    }
    // Avoid ABNF rules like: "b64token    = 1*( ALPHA / DIGIT /" which are not definition terms
    if (abnfRuleStartRegex.test(line)) {
        return false;
    }
    // Avoid Table of Contents numbered or appendix lines
    if (tocNumberedStartRegex.test(line) || tocAppendixStartRegex.test(line)) {
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
    // Disallow obvious code constructs that commonly appear in narrative paragraphs
    // e.g., function calls or blocks spanning multiple lines
    if (trimmed.endsWith('(')) {
        return false; // looks like a function call continuation
    }
    if (/^[{}]$/.test(trimmed) || /[{]\s*$/.test(trimmed)) {
        return false; // looks like a code block delimiter
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
    // Exclude obvious non-term technical lines (URLs or HTTP request start)
    // Allow generic slashes in natural language terms (e.g., manufacture/modification)
    if (/https?:\/\//i.test(trimmed)) {
        return false; // URL-like content
    }
    if (/^\s*[A-Z][A-Z-]{2,}\s+\/.*/.test(trimmed)) {
        return false; // likely an HTTP method + path
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
        if (line === null) {
            return false;
        }
        if (PageFooterMatcher.test(context) || PageBreakMatcher.test(context) || PageHeaderMatcher.test(context)) {
            return false;
        }
        if (next !== null && isTermLine(line, next, false)) {
            return true;
        }
        // Also allow single-line inline definition items (term 2+spaces definition)
        return splitInlineColumns(line) !== null;
    },
    parse: (context) => {
        const items: DefinitionItemNode[] = [];

        // Establish base term indentation from first item
        while (!context.cursor.isEOL()) {
            const line = context.peek(0);
            const next = context.peek(1);
            if (line === null) {
                break;
            }
            const isMultiLine = next !== null && isTermLine(line, next);
            const inlineSplit = splitInlineColumns(line);
            if (!isMultiLine && inlineSplit === null) {
                break;
            }

            let termIndent: number = 0;
            let definitionIndent: number = 0;
            // Support inline definition after a colon label or general inline split.
            let rawTerm: string;
            let term: string;
            const item: DefinitionItemNode = {
                term: '',
                termIndent: 0,
                definitionIndent: 0,
                lines: [],
            };
            if (isMultiLine) {
                termIndent = getIndentation(line);
                definitionIndent = getIndentation(next!);
                rawTerm = sliceLineText(line, termIndent);
                term = rawTerm;
                item.term = term;
                item.termIndent = termIndent;
                item.definitionIndent = definitionIndent;
                // Allow colon+two spaces inline fragment even in multi-line scenarios
                const inlineMatch = rawTerm.match(/^(.*?:)\s{2,}(\S.*)$/);
                if (inlineMatch) {
                    item.term = inlineMatch[1]!;
                    item.lines.push(inlineMatch[2]!);
                    item.inline = true;
                }
                // Consume term line
                context.advance();
            } else if (inlineSplit !== null) {
                termIndent = inlineSplit.termIndent;
                definitionIndent = inlineSplit.defIndent;
                term = inlineSplit.termText;
                item.term = term;
                item.termIndent = termIndent;
                item.definitionIndent = definitionIndent;
                item.lines.push(inlineSplit.defText);
                item.inline = true;
                // Consume the single-line item
                context.advance();
            }

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
                const childInline = splitInlineColumns(childTerm);
                if (!isTermLine(childTerm, childNext, true) && childInline === null) {
                    break;
                }
                const childTermIndent = childInline ? childInline.termIndent : getIndentation(childTerm);
                if (childTermIndent < definitionIndent) {
                    break; // not deeper than current item's definition
                }
                const childDefinitionIndent = childInline ? childInline.defIndent : getIndentation(childNext);
                const childRawTerm = childInline ? childInline.termText : sliceLineText(childTerm, childTermIndent);
                const child: DefinitionItemNode = {
                    term: childRawTerm,
                    termIndent: childTermIndent,
                    definitionIndent: childDefinitionIndent,
                    lines: [],
                };
                if (childInline) {
                    child.lines.push(childInline.defText);
                    child.inline = true;
                } else {
                    // Handle inline definition after a colon label for child items as well.
                    const inlineMatch = childRawTerm.match(/^(.*?:)\s{2,}(\S.*)$/);
                    if (inlineMatch) {
                        child.term = inlineMatch[1]!;
                        child.lines.push(inlineMatch[2]!);
                        child.inline = true;
                    }
                }
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
            const hasNextTerm = isTermLine(after, afterNext) || splitInlineColumns(after) !== null;
            if (!hasNextTerm) {
                break;
            }
        }

        return {
            type: 'DefinitionList',
            items,
        } as DefinitionListNode;
    },
};
