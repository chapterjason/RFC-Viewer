import type {MetadataNode} from "../Node/MetadataNode.js";

export function renderMetadata(node: MetadataNode): string[] {
    return [...node.lines];
}