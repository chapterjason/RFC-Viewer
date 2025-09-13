import type {ListItemNode} from "../Node/ListNode.js";

export function renderListItem(item: ListItemNode): string[] {
    const marker = item.marker;
    const markerLength = marker.length;
    // Reconstruct with a predictable, normalized layout:
    // - No leading indentation before the marker
    // - Content begins at column = contentIndent
    // - This implies spacesAfter = contentIndent - markerLength
    const spacesAfter = Math.max(0, item.contentIndent - markerLength);
    const gap = " ".repeat(spacesAfter);
    const head = `${marker}${gap}${item.lines[0] ?? ""}`;
    const continuationIndent = " ".repeat(item.contentIndent);
    const rest = item.lines.slice(1).map((line) =>
        line.length === 0 ? "" : continuationIndent + line,
    );
    return [head, ...rest];
}