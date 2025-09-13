import type {PageFooterNode} from "../Node/PageFooterNode.js";

export function renderPageFooter(node: PageFooterNode): string[] {
    return [node.text];
}