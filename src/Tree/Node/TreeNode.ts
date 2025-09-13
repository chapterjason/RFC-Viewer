import type {DocumentNode} from "./DocumentNode.js";
import type {ParagraphNode} from "./ParagraphNode.js";
import type {BlankLineNode} from "./BlankLineNode.js";
import type {IndentedBlockNode} from "./IndentedBlockNode.js";
import type {MetadataNode} from "./MetadataNode.js";
import type {TitleNode} from "./TitleNode.js";
import type {SectionTitleNode} from "./SectionTitleNode.js";

export type TreeNode = DocumentNode | ParagraphNode | BlankLineNode | IndentedBlockNode | MetadataNode | TitleNode | SectionTitleNode;
