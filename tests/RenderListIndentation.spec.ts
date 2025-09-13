import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {renderDocument} from '../src/Tree/Render/RenderDocument.js';

describe('RenderList indentation', () => {
    it('preserves leading indentation before list markers', () => {
        // Arrange: list items with 3-space indentation before the marker
        const inputLines = [
            '   o  specify the client type as described in Section 2.1,',
            '   o  provide its client redirection URIs as described in Section 3.1.2,',
            '      and',
        ];
        const cursor = new ArrayCursor(inputLines);

        // Act: parse then render back to lines
        const document = parse(cursor);
        const rendered = renderDocument(document);

        // Assert: bullets should retain the 3-space indentation before the marker
        expect(rendered[0]).toBe(inputLines[0]);
        expect(rendered[1]).toBe(inputLines[1]);
        // Continuation line aligns to content indent (6 spaces here)
        expect(rendered[2]).toBe(inputLines[2]);
    });
});

