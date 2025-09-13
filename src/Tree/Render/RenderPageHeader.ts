import type {PageHeaderNode} from "../Node/PageHeaderNode.js";

export function renderPageHeader(node: PageHeaderNode): string[] {
    return [node.text];
}