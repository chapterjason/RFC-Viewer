import type {DocumentNode} from "../Node/DocumentNode.js";
import {renderNode} from "./RenderNode.js";

export function renderDocument(document: DocumentNode): string[] {
    const output: string[] = [];
    for (const child of document.children) {
        output.push(...renderNode(child));
    }
    return output;
}