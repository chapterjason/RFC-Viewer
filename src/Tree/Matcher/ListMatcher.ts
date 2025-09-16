import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import type {BlockContext} from "../BlockContext.js";
import type {ListItemsType, ListNode} from "../Node/ListNode.js";
import type {ListItemChildrenType, ListItemNode} from "../Node/ListItemNode.js";
import type {BlankLineNode} from "../Node/BlankLineNode.js";
import type {PageFooterNode} from "../Node/PageFooterNode.js";
import type {PageBreakNode} from "../Node/PageBreakNode.js";
import type {PageHeaderNode} from "../Node/PageHeaderNode.js";
import {PageBreakMatcher} from "./PageBreakMatcher.js";
import {PageFooterMatcher} from "./PageFooterMatcher.js";
import {PageHeaderMatcher} from "./PageHeaderMatcher.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";
import {paragraphFromLines} from "../../Utils/ParagraphFromLines.js";

const abnfRuleStartRegex = /^\s*[A-Za-z][A-Za-z0-9-]*\s*=\/?\s+.+$/;
const tocNumberedStartRegex = /^\s*\d+(?:\.\d+)*\.\s+\S/;
const tocAppendixStartRegex = /^\s*Appendix\s+[A-Za-z]+\.?\s+\S/;

interface BulletListMatch {
    kind: 'bullet';
    marker: string;
    markerLength: number;
    contentIndent: number;
    leadingIndent: number;
    markerOnly: boolean;
    style: string;
}

interface DefinitionTermInfo {
    kind: 'definition';
    termLines: string[];
    termIndent: number;
    definitionIndent: number;
    inline: boolean;
    firstDefinitionLine: string | null;
}

type ListMatch = BulletListMatch | DefinitionTermInfo;

function classifyBulletMarker(marker: string): string {
    if (marker === 'o') {
        return 'bullet:circle';
    }
    if (marker === '*') {
        return 'bullet:star';
    }
    if (marker === '-') {
        return 'bullet:dash';
    }
    if (/^\d+\.$/.test(marker)) {
        return 'bullet:number';
    }
    if (/^\([A-Za-z0-9][A-Za-z0-9.\-]*\)$/.test(marker)) {
        return 'bullet:parenthesized';
    }
    if (/^\[[^\]]+\]$/.test(marker)) {
        return 'bullet:bracketed';
    }
    return 'bullet:generic';
}

function detectBulletListMarker(line: string): BulletListMatch | null {
    const trimmed = line.trim();
    if (/\.{2,}\s*\d+\s*$/.test(trimmed)) {
        return null;
    }

    let m = line.match(/^(\s*)o(\s{2,})(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const spaces = m[2] ?? '';
        return {
            kind: 'bullet',
            marker: 'o',
            markerLength: 1,
            contentIndent: leading.length + 1 + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker('o'),
        };
    }

    m = line.match(/^(\s*)\*(\s{2,})(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const spaces = m[2] ?? '';
        return {
            kind: 'bullet',
            marker: '*',
            markerLength: 1,
            contentIndent: leading.length + 1 + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker('*'),
        };
    }

    m = line.match(/^(\s*)-(\s{2,})(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const spaces = m[2] ?? '';
        return {
            kind: 'bullet',
            marker: '-',
            markerLength: 1,
            contentIndent: leading.length + 1 + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker('-'),
        };
    }

    m = line.match(/^(\s*)(\d+\.)(\s+)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            kind: 'bullet',
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker(marker),
        };
    }

    m = line.match(/^(\s*)(\([A-Za-z0-9][A-Za-z0-9.\-]*\))(\s+)(\S.*)?$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            kind: 'bullet',
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker(marker),
        };
    }

    m = line.match(/^(\s*)(\[[^\]]+\])(\s{2,})(\S.*)$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        const spaces = m[3] ?? '';
        return {
            kind: 'bullet',
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length + spaces.length,
            leadingIndent: leading.length,
            markerOnly: false,
            style: classifyBulletMarker(marker),
        };
    }

    m = line.match(/^(\s*)(\[[^\]]+\])\s*$/);
    if (m) {
        const leading = m[1] ?? '';
        const marker = m[2] ?? '';
        return {
            kind: 'bullet',
            marker,
            markerLength: marker.length,
            contentIndent: leading.length + marker.length,
            leadingIndent: leading.length,
            markerOnly: true,
            style: classifyBulletMarker(marker),
        };
    }

    return null;
}

function splitInlineColumns(line: string): {
    termIndent: number;
    termText: string;
    defIndent: number;
    defText: string;
} | null {
    if (line === null || isBlankLine(line)) {
        return null;
    }
    if (abnfRuleStartRegex.test(line)) {
        return null;
    }
    const trimmedRight = line.trimEnd();
    if (/\.{2,}\s*\d+\s*$/.test(trimmedRight)) {
        return null;
    }
    if (/https?:\/\//i.test(trimmedRight)) {
        return null;
    }
    const termIndent = getIndentation(line);
    if (termIndent < 2) {
        return null;
    }
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
    if (termText.includes(' ')) {
        return null;
    }
    if (/^\d+$/.test(termText)) {
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
    if (abnfRuleStartRegex.test(line)) {
        return false;
    }
    if (tocNumberedStartRegex.test(line) || tocAppendixStartRegex.test(line)) {
        return false;
    }

    const termIndent = getIndentation(line);
    const nextIndent = getIndentation(next);

    if (termIndent < 2) {
        return false;
    }

    if (!allowDeep && termIndent >= 4) {
        if (nextIndent - termIndent < 4) {
            return false;
        }
    }

    if (nextIndent <= termIndent) {
        return false;
    }

    if (nextIndent < termIndent + 2) {
        return false;
    }

    const trimmed = line.trimEnd();
    if (/\.{2,}\s*\d+\s*$/.test(trimmed)) {
        return false;
    }

    if (trimmed.endsWith('(')) {
        return false;
    }

    if (/^[{}]$/.test(trimmed) || /[{]\s*$/.test(trimmed)) {
        return false;
    }

    if (/[.;]$/.test(trimmed)) {
        return false;
    }

    if (/:$/.test(trimmed)) {
        const body = trimmed.slice(0, -1);
        if (body.includes('.')) {
            return false;
        }
    }

    if (/https?:\/\//i.test(trimmed)) {
        return false;
    }

    if (/^\s*[A-Z][A-Z-]{2,}\s+\/.*/.test(trimmed)) {
        return false;
    }

    const listMatch = detectBulletListMarker(line);
    if (listMatch) {
        return false;
    }

    return true;
}

function detectDefinitionStart(context: {peek: (offset: number) => string | null}): DefinitionTermInfo | null {
    const line1 = context.peek(0);
    const line2 = context.peek(1);
    const line3 = context.peek(2);

    if (line1 === null) {
        return null;
    }

    const inlineSplit = splitInlineColumns(line1);
    if (inlineSplit !== null) {
        return {
            kind: 'definition',
            termLines: [inlineSplit.termText],
            termIndent: inlineSplit.termIndent,
            definitionIndent: inlineSplit.defIndent,
            inline: true,
            firstDefinitionLine: inlineSplit.defText,
        };
    }

    if (line2 !== null && isTermLine(line1, line2, false)) {
        return {
            kind: 'definition',
            termLines: [sliceLineText(line1, getIndentation(line1))],
            termIndent: getIndentation(line1),
            definitionIndent: getIndentation(line2),
            inline: false,
            firstDefinitionLine: null,
        };
    }

    if (line2 !== null && line3 !== null && isTermLine(line2, line3, false) && !isTermLine(line1, line2, false)) {
        return {
            kind: 'definition',
            termLines: [sliceLineText(line1, getIndentation(line1)), sliceLineText(line2, getIndentation(line1))],
            termIndent: getIndentation(line1),
            definitionIndent: getIndentation(line3),
            inline: false,
            firstDefinitionLine: null,
        };
    }

    return null;
}

function createBlankLineNode(): BlankLineNode {
    return {type: 'BlankLine'};
}

class ListItemContentBuilder {
    private readonly children: ListItemChildrenType[] = [];
    private readonly paragraphLines: string[] = [];

    constructor(private readonly baseIndent: number) {
    }

    addLine(line: string): void {
        this.paragraphLines.push(line);
    }

    addBlank(): void {
        this.flushParagraph();
        this.children.push(createBlankLineNode());
    }

    addNode(node: Exclude<ListItemChildrenType, ReturnType<typeof createBlankLineNode>>): void {
        this.flushParagraph();
        this.children.push(node);
    }

    finish(): ListItemChildrenType[] {
        this.flushParagraph();
        return this.children;
    }

    private flushParagraph(): void {
        if (this.paragraphLines.length === 0) {
            return;
        }
        const paragraph = paragraphFromLines([...this.paragraphLines]);
        this.children.push(paragraph);
        this.paragraphLines.length = 0;
    }
}

function gatherBlankLines(context: {peek: (offset: number) => string | null}): number {
    let offset = 0;
    while (true) {
        const peeked = context.peek(offset);
        if (peeked === null || !isBlankLine(peeked)) {
            break;
        }
        offset += 1;
    }
    return offset;
}

function parseNestedList(context: BlockContext, builder: ListItemContentBuilder, currentIndent: number): boolean {
    const nextLine = context.peek(0);
    if (nextLine === null) {
        return false;
    }

    const bullet = detectBulletListMarker(nextLine);
    const definition = detectDefinitionStart(context);

    if (!bullet && !definition) {
        return false;
    }

    const leadingIndent = bullet ? bullet.leadingIndent : definition!.termIndent;
    if (leadingIndent < currentIndent) {
        return false;
    }

    const nestedList = ListMatcher.parse(context);
    builder.addNode(nestedList as ListNode);
    return true;
}

function parseBulletItem(context: BlockContext, match: BulletListMatch, listMarkerIndent: number): {item: ListItemNode; baseIndentCandidate: number} {
    const builder = new ListItemContentBuilder(match.contentIndent);
    const item: ListItemNode = {
        type: 'ListItem',
        marker: match.marker,
        markerIndent: match.leadingIndent,
        contentIndent: match.contentIndent,
        markerOnly: match.markerOnly,
        children: [],
    };

    const originalLine = context.peek(0);
    if (originalLine === null) {
        return {item, baseIndentCandidate: match.contentIndent};
    }

    let inlineFirstLine = false;
    if (!match.markerOnly) {
        const firstContent = sliceLineText(originalLine, match.contentIndent);
        if (firstContent.length > 0) {
            builder.addLine(firstContent);
            inlineFirstLine = true;
        }
        context.advance();
    } else {
        context.advance();
        const nextLine = context.peek(0);
        if (nextLine !== null && !isBlankLine(nextLine)) {
            const nextIndent = getIndentation(nextLine);
            item.contentIndent = nextIndent;
            const firstContent = sliceLineText(nextLine, item.contentIndent);
            builder.addLine(firstContent);
            context.advance();
        }
    }

    let previousWasBlank = false;
    let paragraphIndent: number | null = null;
    while (!context.cursor.isEOL()) {
        if (PageFooterMatcher.test(context)) {
            builder.addNode(PageFooterMatcher.parse(context) as PageFooterNode);
            previousWasBlank = false;
            paragraphIndent = null;
            continue;
        }
        if (PageBreakMatcher.test(context)) {
            builder.addNode(PageBreakMatcher.parse(context) as PageBreakNode);
            previousWasBlank = false;
            paragraphIndent = null;
            continue;
        }
        if (PageHeaderMatcher.test(context)) {
            builder.addNode(PageHeaderMatcher.parse(context) as PageHeaderNode);
            previousWasBlank = false;
            paragraphIndent = null;
            continue;
        }

        const continuation = context.peek(0);
        if (continuation === null) {
            break;
        }

        if (isBlankLine(continuation)) {
            let offset = 1;
            let nextNonBlank: string | null = null;
            while (true) {
                const peeked = context.peek(offset);
                if (peeked === null) {
                    break;
                }
                if (!isBlankLine(peeked)) {
                    nextNonBlank = peeked;
                    break;
                }
                offset += 1;
            }
            if (nextNonBlank === null) {
                break;
            }
            const nextMatch = detectBulletListMarker(nextNonBlank) ?? detectDefinitionStart({peek: (off: number) => context.peek(off + offset)});
            if (nextMatch && nextMatch.kind === 'bullet' && nextMatch.leadingIndent === listMarkerIndent) {
                break;
            }
            if (nextMatch && nextMatch.kind === 'definition' && nextMatch.termIndent <= listMarkerIndent) {
                break;
            }
            const nextIndent = getIndentation(nextNonBlank);
            if (nextIndent >= item.contentIndent) {
                builder.addBlank();
                context.advance();
                previousWasBlank = true;
                paragraphIndent = null;
                continue;
            }
            break;
        }

        const nestedHandled = parseNestedList(context, builder, item.contentIndent);
        if (nestedHandled) {
            previousWasBlank = false;
            paragraphIndent = null;
            continue;
        }

        const listMatch = detectBulletListMarker(continuation);
        if (listMatch && listMatch.leadingIndent === listMarkerIndent) {
            break;
        }

        const contIndent = getIndentation(continuation);
        if (contIndent >= item.contentIndent) {
            builder.addLine(sliceLineText(continuation, item.contentIndent));
            context.advance();
            previousWasBlank = false;
            continue;
        }
        if ((previousWasBlank || paragraphIndent !== null) && contIndent >= item.contentIndent) {
            if (paragraphIndent === null) {
                paragraphIndent = contIndent;
            }
            const sliceAt = Math.min(paragraphIndent, contIndent);
            builder.addLine(sliceLineText(continuation, sliceAt));
            context.advance();
            previousWasBlank = false;
            continue;
        }
        break;
    }

    item.children = builder.finish();
    if (item.markerOnly && item.children.length === 0) {
        item.markerOnly = true;
    } else {
        delete item.markerOnly;
    }
    if (inlineFirstLine && item.children.length > 0) {
        item.inline = true;
    }

    return {
        item,
        baseIndentCandidate: Math.min(getIndentation(originalLine), item.contentIndent),
    };
}

function parseDefinitionItem(context: BlockContext): ListItemNode {
    const termInfo = detectDefinitionStart(context);
    if (!termInfo) {
        throw new Error('Expected definition term start');
    }

    const builder = new ListItemContentBuilder(termInfo.definitionIndent);

    const markerLines = [...termInfo.termLines];
    let colonInlineText: string | null = null;
    if (!termInfo.inline) {
        const lastIndex = markerLines.length - 1;
        const colonMatch = markerLines[lastIndex]?.match(/^(.*?:)\s{2,}(\S.*)$/);
        if (colonMatch) {
            markerLines[lastIndex] = colonMatch[1]!;
            colonInlineText = colonMatch[2]!;
        }
    }

    const item: ListItemNode = {
        type: 'ListItem',
        marker: markerLines.join("\n"),
        markerIndent: termInfo.termIndent,
        contentIndent: termInfo.definitionIndent,
        markerOnly: false,
        children: [],
    };

    if (termInfo.termLines.length === 1) {
        context.advance();
    } else {
        context.advance();
        context.advance();
    }

    if (termInfo.inline && termInfo.firstDefinitionLine) {
        builder.addLine(termInfo.firstDefinitionLine);
    } else if (colonInlineText) {
        builder.addLine(colonInlineText);
    }

    while (!context.cursor.isEOL()) {
        if (PageFooterMatcher.test(context)) {
            builder.addNode(PageFooterMatcher.parse(context) as PageFooterNode);
            continue;
        }
        if (PageBreakMatcher.test(context)) {
            builder.addNode(PageBreakMatcher.parse(context) as PageBreakNode);
            continue;
        }
        if (PageHeaderMatcher.test(context)) {
            builder.addNode(PageHeaderMatcher.parse(context) as PageHeaderNode);
            continue;
        }

        const line = context.peek(0);
        if (line === null) {
            break;
        }

        if (isBlankLine(line)) {
            const blanks = gatherBlankLines(context);
            const next = context.peek(blanks);
            if (next === null) {
                break;
            }
            const nextTerm = detectDefinitionStart({
                peek: (offset: number) => context.peek(blanks + offset),
            });
            if (nextTerm && nextTerm.termIndent <= item.markerIndent) {
                break;
            }
            const nextIndent = getIndentation(next);
            if (nextIndent >= item.contentIndent) {
                builder.addBlank();
                context.advance();
                continue;
            }
            break;
        }

        const indent = getIndentation(line);
        const nextLine = context.peek(1);
        if (nextLine !== null && isTermLine(line, nextLine, true)) {
            if (indent >= item.contentIndent) {
                break;
            }
        }
        if (indent >= item.contentIndent) {
            builder.addLine(sliceLineText(line, item.contentIndent));
            context.advance();
            continue;
        }
        if (parseNestedList(context, builder, item.contentIndent)) {
            continue;
        }
        break;
    }

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
        if (childTermIndent < item.contentIndent) {
            break;
        }
        const nestedList = ListMatcher.parse(context);
        builder.addNode(nestedList as ListNode);
    }

    item.children = builder.finish();
    if (item.children.length === 0) {
        item.markerOnly = true;
    } else {
        delete item.markerOnly;
    }
    const hasInlineContent = (termInfo.inline && termInfo.firstDefinitionLine) || colonInlineText;
    if (hasInlineContent && item.children.length > 0) {
        item.inline = true;
    } else {
        delete item.inline;
    }
    return item;
}

function parseList(context: BlockContext): ListNode {
    const items: ListItemsType[] = [];
    let listMarkerIndent: number | null = null;
    let listBaseIndent: number | null = null;
    let styleKey: string | null = null;
    let mode: 'bullet' | 'definition' | null = null;

    while (!context.cursor.isEOL()) {
        const line = context.peek(0);
        if (line === null) {
            break;
        }

        if (PageFooterMatcher.test(context)) {
            if (items.length === 0) {
                break;
            }
            items.push(PageFooterMatcher.parse(context) as PageFooterNode);
            continue;
        }
        if (PageBreakMatcher.test(context)) {
            if (items.length === 0) {
                break;
            }
            items.push(PageBreakMatcher.parse(context) as PageBreakNode);
            continue;
        }
        if (PageHeaderMatcher.test(context)) {
            if (items.length === 0) {
                break;
            }
            items.push(PageHeaderMatcher.parse(context) as PageHeaderNode);
            continue;
        }

        if (isBlankLine(line)) {
            if (items.length === 0) {
                break;
            }
            let offset = 1;
            let nextNonBlank: string | null = null;
            while (true) {
                const peeked = context.peek(offset);
                if (peeked === null) {
                    break;
                }
                if (!isBlankLine(peeked)) {
                    nextNonBlank = peeked;
                    break;
                }
                offset += 1;
            }
            if (nextNonBlank === null) {
                break;
            }
            const lookaheadContext = {
                peek: (innerOffset: number) => context.peek(offset + innerOffset),
            };
            const nextBullet = detectBulletListMarker(nextNonBlank);
            const nextDefinition = detectDefinitionStart(lookaheadContext);
            const continuesBulletList = mode === 'bullet'
                && nextBullet !== null
                && nextBullet.style === styleKey
                && nextBullet.leadingIndent === listMarkerIndent;
            const continuesDefinitionList = mode === 'definition'
                && nextDefinition !== null
                && nextDefinition.termIndent === listMarkerIndent;
            if (continuesBulletList || continuesDefinitionList) {
                context.advance();
                items.push(createBlankLineNode());
                continue;
            }
            break;
        }

        const bullet = detectBulletListMarker(line);
        if (mode === null && bullet) {
            const isPureNumericMarker = /^\d+\.$/.test(bullet.marker);
            if (isPureNumericMarker && bullet.leadingIndent === 0) {
                const next = context.peek(1);
                if (next === null || isBlankLine(next)) {
                    break;
                }
                const nextIsList = detectBulletListMarker(next) !== null;
                if (!nextIsList) {
                    const nextIndent = getIndentation(next);
                    if (nextIndent > 0) {
                        break;
                    }
                }
            }
            mode = 'bullet';
            styleKey = bullet.style;
            listMarkerIndent = bullet.leadingIndent;
        }

        if (mode === 'bullet') {
            if (!bullet || bullet.style !== styleKey) {
                break;
            }
            if (bullet.leadingIndent !== listMarkerIndent) {
                break;
            }
            if (listBaseIndent !== null && bullet.contentIndent < listBaseIndent) {
                break;
            }
            const {item, baseIndentCandidate} = parseBulletItem(context, bullet, listMarkerIndent);
            if (listBaseIndent === null) {
                listBaseIndent = baseIndentCandidate;
            }
            items.push(item);
            continue;
        }

        const definitionStart = detectDefinitionStart(context);
        if (mode === null && definitionStart) {
            mode = 'definition';
            listMarkerIndent = definitionStart.termIndent;
            styleKey = 'definition';
        }

        if (mode === 'definition') {
            if (!definitionStart) {
                break;
            }
            if (definitionStart.termIndent !== listMarkerIndent) {
                break;
            }
            const item = parseDefinitionItem(context);
            items.push(item);
            continue;
        }

        break;
    }

    return {
        type: 'List',
        items,
    };
}

export const ListMatcher: BlockMatcher = {
    name: 'list',
    priority: 35,
    test: (context) => {
        const bullet = detectBulletListMarker(context.peek(0) ?? '');
        if (bullet) {
            for (let back = -1; back >= -3; back -= 1) {
                const prev = context.peek(back);
                if (prev === null) {
                    break;
                }
                if (isBlankLine(prev)) {
                    continue;
                }
                if (prev.trim() === 'Table of Contents') {
                    return false;
                }
                break;
            }
            const isPureNumericMarker = /^\d+\.$/.test(bullet.marker);
            if (isPureNumericMarker && bullet.leadingIndent === 0) {
                const next = context.peek(1);
                if (next === null || isBlankLine(next)) {
                    return false;
                }
                const nextIsList = detectBulletListMarker(next) !== null;
                if (!nextIsList) {
                    const nextIndent = getIndentation(next);
                    if (nextIndent > 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        const definition = detectDefinitionStart(context);
        return definition !== null;
    },
    parse: (context) => parseList(context),
};
