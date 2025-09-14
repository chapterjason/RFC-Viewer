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
            const currentStart = item.termIndent + item.termLines[item.termLines.length - 1]!.length;
            const gapSize = Math.max(minGap, item.definitionIndent - currentStart);
            const gap = " ".repeat(gapSize);

            for (let index = 0; index < item.termLines.length; index++) {
                const termLine = item.termLines[index];

                if (index === 0) {
                    lines.push(`${termIndent}${termLine}${gap}${item.lines[0]}`);

                    continue;
                }

                lines.push(`${termIndent}${termLine}`);
            }

            for (let index = 1; index < item.lines.length; index += 1) {
                const defLine = item.lines[index] ?? '';
                lines.push(defLine.length === 0 ? '' : `${defIndent}${defLine}`);
            }
        } else {
            for (let index = 0; index < item.termLines.length; index++) {
                const termLine = item.termLines[index];
                lines.push(`${termIndent}${termLine}`);
            }

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
