import type {DefinitionListNode} from "../Node/DefinitionListNode.js";

export function renderDefinitionList(node: DefinitionListNode): string[] {
    const lines: string[] = [];
    const renderItem = (item: DefinitionListNode['items'][number]) => {
        const termIndent = " ".repeat(item.termIndent);
        const defIndent = " ".repeat(item.definitionIndent);
        if (item.inline === true && item.lines.length > 0) {
            // Preserve inline label style: term + two spaces + first definition fragment
            lines.push(`${termIndent}${item.term}  ${item.lines[0]}`);
            for (let index = 1; index < item.lines.length; index += 1) {
                const defLine = item.lines[index] ?? '';
                lines.push(defLine.length === 0 ? '' : `${defIndent}${defLine}`);
            }
        } else {
            lines.push(`${termIndent}${item.term}`);
            for (const defLine of item.lines) {
                lines.push(defLine.length === 0 ? '' : `${defIndent}${defLine}`);
            }
        }
        if (item.children && item.children.length > 0) {
            for (const child of item.children) {
                renderItem(child);
            }
        }
    };
    for (const item of node.items) {
        renderItem(item);
    }
    return lines;
}
