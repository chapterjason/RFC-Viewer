import type {DefinitionListNode} from "../Node/DefinitionListNode.js";

export function renderDefinitionList(node: DefinitionListNode): string[] {
    const lines: string[] = [];
    const renderItem = (item: DefinitionListNode['items'][number]) => {
        const termIndent = " ".repeat(item.termIndent);
        const defIndent = " ".repeat(item.definitionIndent);
        if (item.inline === true && item.lines.length > 0) {
            // Inline style: keep the first definition fragment on the same line.
            // Use computed definitionIndent to preserve alignment; minimum gap of 2.
            const minGap = 2;
            const currentStart = item.termIndent + item.term.length;
            const gapSize = Math.max(minGap, item.definitionIndent - currentStart);
            const gap = " ".repeat(gapSize);
            lines.push(`${termIndent}${item.term}${gap}${item.lines[0]}`);
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
