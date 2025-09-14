import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';
import {renderToString} from '../src/Tree/Render/RenderToString.js';
import type {PaketDiagramNode} from "../src/Tree/Node/PaketDiagramNode.js";

describe('PaketDiagramMatcher', () => {
    it('parses a simple diagram with caption (Figure 6)', () => {
        // Arrange: minimal RFC-like context around a diagram and caption
        const snippet = [
            '',
            '5.1.  UUID Version 1',
            '',
            '    1                   2                   3',
            '    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1',
            '   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+',
            '   |                           time_low                            |',
            '   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+',
            '   |           time_mid            |  ver  |       time_high       |',
            '   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+',
            '   |var|         clock_seq         |             node              |',
            '   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+',
            '   |                              node                             |',
            '   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+',
            '',
            '               Figure 6: UUIDv1 Field and Bit Layout',
            '',
            'Some text after.',
        ];

        // Act: parse and locate Figure node
        const document = parse(new ArrayCursor(snippet)) as DocumentNode;
        const nodes = document.children.filter(n => n.type === 'PaketDiagram') as PaketDiagramNode[];

        // Assert: exactly one figure with expected content and rendering stable
        expect(nodes.length).toBe(1);

        const node = nodes[0];
        expect(node.lines[0]).toContain('1                   2                   3');
        expect(node.lines[node.lines.length - 1]).toContain('Figure 6: UUIDv1 Field and Bit Layout');

        const roundTrip = renderToString(document);
        expect(roundTrip).toBe(snippet.join('\n'));
    });
});
