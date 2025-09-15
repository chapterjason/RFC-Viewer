import type {ListItemNode} from "../Node/ListItemNode.js";

export function renderListItem(item: ListItemNode): string[] {
    const marker = item.marker;
    const markerLength = marker.length;
    // Preserve leading indentation before marker and align content at contentIndent.
    const leading = " ".repeat(item.markerIndent);
    const spacesAfter = Math.max(0, item.contentIndent - item.markerIndent - markerLength);
    const gap = " ".repeat(spacesAfter);
    const head = item.markerOnly
        ? `${leading}${marker}`
        : `${leading}${marker}${gap}${item.lines[0] ?? ""}`;
    const continuationIndent = " ".repeat(item.contentIndent);
    const restSource = item.markerOnly ? item.lines : item.lines.slice(1);
    const rest = restSource.map((line) => (line.length === 0 ? "" : continuationIndent + line));
    return [head, ...rest];
}
