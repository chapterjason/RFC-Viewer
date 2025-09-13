import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface HttpResponseNode extends BaseTreeNode {
    type: "HttpResponse";
    lines: string[];
    bodyLines?: string[];
}
