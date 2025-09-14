export function sliceLineText(line: string, start: number) {
    return line.slice(Math.min(start, line.length));
}