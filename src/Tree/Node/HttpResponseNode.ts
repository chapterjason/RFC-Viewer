import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface HttpResponseNode extends BaseTreeNode {
    type: "HttpResponse";
    indent: number;
    statusLine: string;
    headerLines: string[];
    bodyLines?: string[];
}
