import type {BlockContext} from "./BlockContext.js";
import type {TreeNode} from "./Node/TreeNode.js";

export interface BlockMatcher {
    priority?: number;
    name?: string;

    test(context: BlockContext): boolean;

    parse(context: BlockContext): TreeNode;
}