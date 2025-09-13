import type {TreeNode} from "../Node/TreeNode.js";
import {renderParagraph} from "./RenderParagraph.js";
import type {ParagraphNode} from "../Node/ParagraphNode.js";
import {renderBlankLine} from "./RenderBlankLine.js";
import type {BlankLineNode} from "../Node/BlankLineNode.js";
import {renderIndentedBlock} from "./RenderIndentedBlock.js";
import type {IndentedBlockNode} from "../Node/IndentedBlockNode.js";
import {renderMetadata} from "./RenderMetadata.js";
import type {MetadataNode} from "../Node/MetadataNode.js";
import {renderTitle} from "./RenderTitle.js";
import type {TitleNode} from "../Node/TitleNode.js";
import {renderSectionTitle} from "./RenderSectionTitle.js";
import type {SectionTitleNode} from "../Node/SectionTitleNode.js";
import {renderPageBreak} from "./RenderPageBreak.js";
import type {PageBreakNode} from "../Node/PageBreakNode.js";
import {renderPageFooter} from "./RenderPageFooter.js";
import type {PageFooterNode} from "../Node/PageFooterNode.js";
import {renderPageHeader} from "./RenderPageHeader.js";
import type {PageHeaderNode} from "../Node/PageHeaderNode.js";
import {renderList} from "./RenderList.js";
import type {ListNode} from "../Node/ListNode.js";
import type {DocumentNode} from "../Node/DocumentNode.js";

import {renderDocument} from "./RenderDocument.js";

export function renderNode(node: TreeNode): string[] {
    switch (node.type) {
        case "Paragraph":
            return renderParagraph(node as ParagraphNode);
        case "BlankLine":
            return renderBlankLine(node as BlankLineNode);
        case "IndentedBlock":
            return renderIndentedBlock(node as IndentedBlockNode);
        case "Metadata":
            return renderMetadata(node as MetadataNode);
        case "Title":
            return renderTitle(node as TitleNode);
        case "SectionTitle":
            return renderSectionTitle(node as SectionTitleNode);
        case "PageBreak":
            return renderPageBreak(node as PageBreakNode);
        case "PageFooter":
            return renderPageFooter(node as PageFooterNode);
        case "PageHeader":
            return renderPageHeader(node as PageHeaderNode);
        case "List":
            return renderList(node as ListNode);
        case "Document":
            return renderDocument(node as DocumentNode);
        default:
            // Exhaustiveness safety: if a new node type is added and not rendered explicitly,
            // fall back to a conservative empty render rather than crashing.
            return [];
    }
}