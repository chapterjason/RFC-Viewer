import type {DocumentNode} from "./DocumentNode.js";
import type {ParagraphNode} from "./ParagraphNode.js";
import type {BlankLineNode} from "./BlankLineNode.js";
import type {IndentedBlockNode} from "./IndentedBlockNode.js";

export type TreeNode = DocumentNode | ParagraphNode | BlankLineNode | IndentedBlockNode;