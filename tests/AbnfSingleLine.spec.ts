import {describe, it, expect} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('AbnfMatcher single-line', () => {
    it('detects a single-line ABNF rule when indented', () => {
        // Arrange
        const lines = [
            'Context before',
            '    client-id     = *VSCHAR',
            'Context after',
        ].join('\n').replace(/\r?\n/g, '\n').split('\n');
        const cursor = new ArrayCursor(lines);

        // Act
        const document = parse(cursor);

        // Assert
        const kinds = document.children.map(n => n.type);
        expect(kinds).toContain('Abnf');
        const abnf = document.children.find(n => n.type === 'Abnf') as any;
        expect(abnf.lines).toEqual(['    client-id     = *VSCHAR']);
    });
});

