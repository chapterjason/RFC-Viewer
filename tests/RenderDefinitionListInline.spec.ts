import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

describe('renderList - inline definition term style', () => {
    it('renders the first definition fragment inline with the term label', () => {
        // Arrange: mirrors RFC 6750 formatting for inline label definitions
        const paragraph: ParagraphNode = {
            type: 'Paragraph',
            indent: 0,
            lines: [
                'An attacker may generate a bogus',
                'token or modify the token contents (such as the authentication or',
                'attribute statements) of an existing token, causing the resource',
                'server to grant inappropriate access to the client.  For example,',
                'an attacker may modify the token to extend the validity period; a',
                'malicious client may modify the assertion to gain access to',
                'information that they should not be able to view.',
            ],
        };
        const node: ListNode = {
            type: 'List',
            items: [
                {
                    type: 'ListItem',
                    marker: 'Token manufacture/modification:',
                    markerIndent: 3,
                    contentIndent: 6,
                    markerOnly: false,
                    inline: true,
                    children: [paragraph],
                },
            ],
        };

        // Act
        const lines = renderList(node);

        // Assert: first line stays inline with two spaces after the colon label
        expect(lines[0]).toBe('   Token manufacture/modification:  An attacker may generate a bogus');
        // Assert: continuation lines are indented to contentIndent
        expect(lines[1]).toBe('      token or modify the token contents (such as the authentication or');
        expect(lines[2]).toBe('      attribute statements) of an existing token, causing the resource');
        expect(lines[3]).toBe('      server to grant inappropriate access to the client.  For example,');
        expect(lines[4]).toBe('      an attacker may modify the token to extend the validity period; a');
        expect(lines[5]).toBe('      malicious client may modify the assertion to gain access to');
        expect(lines[6]).toBe('      information that they should not be able to view.');
    });
});
