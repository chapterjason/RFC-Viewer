import type {PageBreakNode} from "../Node/PageBreakNode.js";

export function renderPageBreak(_node: PageBreakNode): string[] {
    // Represent page break as a dedicated form-feed line.
    return ["\f"];
}