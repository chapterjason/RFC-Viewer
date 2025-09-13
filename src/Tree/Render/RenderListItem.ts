import type {ListItemNode} from "../Node/ListNode.js";

export function renderListItem(item: ListItemNode): string[] {
    const marker = item.marker;
    const markerLength = marker.length;
    // Preserve leading indentation before marker and align content at contentIndent.
    const leading = " ".repeat(item.markerIndent);
    const spacesAfter = Math.max(0, item.contentIndent - item.markerIndent - markerLength);
    const gap = " ".repeat(spacesAfter);
    const head = `${leading}${marker}${gap}${item.lines[0] ?? ""}`;
    const continuationIndent = " ".repeat(item.contentIndent);
    const rest = item.lines.slice(1).map((line) =>
        line.length === 0 ? "" : continuationIndent + line,
    );
    return [head, ...rest];
}
