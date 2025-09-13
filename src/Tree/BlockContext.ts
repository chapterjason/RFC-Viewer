import type {ArrayCursor} from "../Utils/ArrayCursor.js";
import type {ParserState} from "./ParserState.js";

export interface BlockContext {
    cursor: ArrayCursor<string>;
    state: ParserState;

    peek(k: number): string | null;

    advance(): void;
}
