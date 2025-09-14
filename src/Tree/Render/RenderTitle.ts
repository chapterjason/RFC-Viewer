import type {TitleNode} from "../Node/TitleNode.js";

export function renderTitle(node: TitleNode): string[] {
    const indent = Math.max(0, node.indent ?? 0);
    if (indent === 0) {
        return [...node.lines];
    }
    const pad = ' '.repeat(indent);
    return node.lines.map((s) => pad + s);
}
