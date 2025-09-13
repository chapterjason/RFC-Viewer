import type {SectionTitleNode} from "../Node/SectionTitleNode.js";

export function renderSectionTitle(node: SectionTitleNode): string[] {
    return [...node.lines];
}