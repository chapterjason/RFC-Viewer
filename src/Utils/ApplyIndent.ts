export function applyIndent(lines: string[], indent: number): string[] {
    const depth = Math.max(0, indent | 0);

    if (depth === 0) {
        return [...lines];
    }

    const prefix = " ".repeat(depth);

    return lines.map((line) => (line.length === 0 ? "" : prefix + line));
}
