import type {BaseTreeNode} from "./BaseTreeNode.js";

import type {TreeNode} from "./TreeNode.js";

export interface DocumentNode extends BaseTreeNode {
    type: 'Document';
    children: TreeNode[];
}