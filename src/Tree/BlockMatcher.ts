import type {BlockContext} from "./BlockContext.js";
import type {TreeNode} from "./Node/TreeNode.js";

export interface BlockMatcher {
    test(context: BlockContext): boolean;

    parse(context: BlockContext): TreeNode;

    priority?: number;
    name?: string;
}