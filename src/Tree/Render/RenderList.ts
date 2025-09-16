import type {ListNode} from "../Node/ListNode.js";
import {renderListItem} from "./RenderListItem.js";
import {renderBlankLine} from "./RenderBlankLine.js";
import {renderPageFooter} from "./RenderPageFooter.js";
import {renderPageHeader} from "./RenderPageHeader.js";
import {renderPageBreak} from "./RenderPageBreak.js";

export function renderList(node: ListNode): string[] {
    const lines: string[] = [];
    const renderNestedList = (child: ListNode): string[] => renderList(child);
    for (const item of node.items) {
        if (item.type === 'ListItem') {
            lines.push(...renderListItem(item, renderNestedList));
            continue;
        }
        switch (item.type) {
            case 'BlankLine':
                lines.push(...renderBlankLine(item));
                break;
            case 'PageFooter':
                lines.push(...renderPageFooter(item));
                break;
            case 'PageHeader':
                lines.push(...renderPageHeader(item));
                break;
            case 'PageBreak':
                lines.push(...renderPageBreak(item));
                break;
        }
    }
    return lines;
}
