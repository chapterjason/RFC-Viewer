import type {TitleNode} from "../Node/TitleNode.js";

export function renderTitle(node: TitleNode): string[] {
    return [...node.lines];
}