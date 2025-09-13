import type {DocumentNode} from "./DocumentNode.js";
import type {ParagraphNode} from "./ParagraphNode.js";
import type {BlankLineNode} from "./BlankLineNode.js";
import type {IndentedBlockNode} from "./IndentedBlockNode.js";
import type {MetadataNode} from "./MetadataNode.js";
import type {TitleNode} from "./TitleNode.js";
import type {SectionTitleNode} from "./SectionTitleNode.js";
import type {PageBreakNode} from "./PageBreakNode.js";
import type {PageFooterNode} from "./PageFooterNode.js";
import type {PageHeaderNode} from "./PageHeaderNode.js";
import type {ListNode} from "./ListNode.js";
import type {TableOfContentsNode} from "./TableOfContentsNode.js";
import type {DefinitionListNode} from "./DefinitionListNode.js";
import type {FigureNode} from "./FigureNode.js";

export type TreeNode =
    DocumentNode
    | ParagraphNode
    | BlankLineNode
    | IndentedBlockNode
    | MetadataNode
    | TitleNode
    | SectionTitleNode
    | PageBreakNode
    | PageFooterNode
    | PageHeaderNode
    | ListNode
    | TableOfContentsNode
    | DefinitionListNode
    | FigureNode;
