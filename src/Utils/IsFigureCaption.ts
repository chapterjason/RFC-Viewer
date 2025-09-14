export function isFigureCaption(line: string): boolean {
    if (line === null) {
        return false;
    }

    const trimmed = line.replace(/^\s+/, "");

    return /^Figure\s+\d+\s*:/.test(trimmed);
}