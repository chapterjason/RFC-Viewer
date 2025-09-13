import type {ListNode} from "../Node/ListNode.js";
import {renderListItem} from "./RenderListItem.js";

export function renderList(node: ListNode): string[] {
    const lines: string[] = [];
    for (const item of node.items) {
        lines.push(...renderListItem(item));
    }
    return lines;
}