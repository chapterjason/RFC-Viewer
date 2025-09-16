import type {ListItemChildrenType, ListItemNode} from "../Node/ListItemNode.js";
import type {ListNode} from "../Node/ListNode.js";
import {renderParagraph} from "./RenderParagraph.js";
import {renderBlankLine} from "./RenderBlankLine.js";
import {renderPageFooter} from "./RenderPageFooter.js";
import {renderPageHeader} from "./RenderPageHeader.js";
import {renderPageBreak} from "./RenderPageBreak.js";

type RenderNestedList = (node: ListNode) => string[];

type Segment = {
    type: ListItemChildrenType['type'];
    lines: string[];
};

function renderChild(child: ListItemChildrenType, renderNestedList: RenderNestedList): Segment {
    switch (child.type) {
        case 'Paragraph':
            return {type: 'Paragraph', lines: renderParagraph(child)};
        case 'List':
            return {type: 'List', lines: renderNestedList(child)};
        case 'BlankLine':
            return {type: 'BlankLine', lines: renderBlankLine(child)};
        case 'PageFooter':
            return {type: 'PageFooter', lines: renderPageFooter(child)};
        case 'PageHeader':
            return {type: 'PageHeader', lines: renderPageHeader(child)};
        case 'PageBreak':
            return {type: 'PageBreak', lines: renderPageBreak(child)};
    }

    const unreachable: never = child;
    return {type: unreachable, lines: []};
}

export function renderListItem(item: ListItemNode, renderNestedList: RenderNestedList): string[] {
    const markerLines = item.marker.length > 0 ? item.marker.split("\n") : [""];
    const leading = " ".repeat(item.markerIndent);
    const segments = item.children.map((child) => renderChild(child, renderNestedList));
    const baseIndentPrefix = " ".repeat(item.contentIndent);

    if (segments.every((segment) => segment.lines.every((line) => line.length === 0))) {
        return markerLines.map((line) => `${leading}${line}`);
    }

    // Locate the first non-empty line for potential inline rendering
    let firstSegmentIndex = -1;
    let firstLineIndex = -1;
    let firstLineText = "";
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
        const segment = segments[segmentIndex]!;
        for (let lineIndex = 0; lineIndex < segment.lines.length; lineIndex += 1) {
            const line = segment.lines[lineIndex]!;
            if (line.length > 0) {
                firstSegmentIndex = segmentIndex;
                firstLineIndex = lineIndex;
                firstLineText = line;
                break;
            }
        }
        if (firstSegmentIndex !== -1) {
            break;
        }
    }

    const output: string[] = [];

    const applyBaseIndent = (text: string): string => (text.length === 0 ? "" : `${baseIndentPrefix}${text}`);

    const appendSegmentLines = (segment: Segment, segmentIndex: number): void => {
        for (let lineIndex = 0; lineIndex < segment.lines.length; lineIndex += 1) {
            if (item.inline && segmentIndex === firstSegmentIndex && lineIndex === firstLineIndex) {
                continue;
            }
            const line = segment.lines[lineIndex]!;
            switch (segment.type) {
                case 'Paragraph':
                    output.push(applyBaseIndent(line));
                    break;
                case 'BlankLine':
                    output.push("");
                    break;
                default:
                    output.push(line);
                    break;
            }
        }
    };

    if (item.inline && firstSegmentIndex !== -1 && firstLineText.length > 0) {
        const targetMarkerIndex = markerLines.length - 1;
        for (let index = 0; index < markerLines.length; index += 1) {
            const markerLine = markerLines[index] ?? "";
            if (index === targetMarkerIndex) {
                const minGap = item.inline ? 2 : 0;
                const currentStart = item.markerIndent + markerLine.length;
                const desiredStart = item.contentIndent;
                const gapSize = Math.max(minGap, desiredStart - currentStart);
                const gap = " ".repeat(Math.max(0, gapSize));
                output.push(`${leading}${markerLine}${gap}${firstLineText}`);
            } else {
                output.push(`${leading}${markerLine}`);
            }
        }
    } else {
        for (const markerLine of markerLines) {
            output.push(`${leading}${markerLine}`);
        }
    }

    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
        appendSegmentLines(segments[segmentIndex]!, segmentIndex);
    }

    return output;
}
