import type {TableOfContentsNode} from "../Node/TableOfContentsNode.js";

export function renderTableOfContents(node: TableOfContentsNode): string[] {
    return [...node.lines];
}

