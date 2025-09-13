import type {Range} from "../Range.js";

export interface BaseTreeNode {
    type: string;
    position: Range;
}