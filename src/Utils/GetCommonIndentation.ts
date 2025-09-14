import {getIndentation} from "./GetIndentation.js";

/**
 * Compute the common left indentation (in spaces) across the provided lines.
 * Blank lines are ignored when computing the minimum.
 * Returns 0 if there are no non-blank lines.
 */
export function getCommonIndentation(lines: string[]): number {
    let base = Infinity;

    for (const line of lines) {
        if (/^\s*$/.test(line)) {
            continue;
        }

        base = Math.min(base, getIndentation(line));
    }

    if (!isFinite(base)) {
        return 0;
    }

    return Math.max(0, base);
}