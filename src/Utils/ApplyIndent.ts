export function applyIndent(lines: readonly string[] | undefined | null, indent: number): string[] {
    const depth = Math.max(0, indent | 0);
    const src: readonly string[] = Array.isArray(lines) ? lines : [];

    if (depth === 0) { return [...src]; }

    const prefix = " ".repeat(depth);

    return src.map((line) => (line.length === 0 ? "" : prefix + line));
}
