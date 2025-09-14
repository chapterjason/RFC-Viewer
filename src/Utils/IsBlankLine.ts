export function isBlankLine(line: string | null) {
    return line !== null && /^\s*$/.test(line);
}