import type {DocumentNode} from "../Node/DocumentNode.js";

import {renderDocument} from "./RenderDocument.js";

export function renderToString(document: DocumentNode): string {
    return renderDocument(document).join("\n");
}