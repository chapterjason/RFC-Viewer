import type {BlankLineNode} from "../Node/BlankLineNode.js";

export function renderBlankLine(_node: BlankLineNode): string[] {
    // Do not emit spaces on otherwise blank lines.
    return [""];
}