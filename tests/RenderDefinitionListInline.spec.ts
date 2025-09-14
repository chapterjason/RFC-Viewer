import {describe, it, expect} from 'vitest';
import {renderDefinitionList} from '../src/Tree/Render/RenderDefinitionList.js';
import type {DefinitionListNode} from '../src/Tree/Node/DefinitionListNode.js';

describe('RenderDefinitionList - inline term style', () => {
  it('renders the first definition fragment inline with the term label', () => {
    // Arrange: mirrors RFC 6750 formatting for inline label definitions
    const node: DefinitionListNode = {
      type: 'DefinitionList',
      items: [
        {
          term: 'Token manufacture/modification:',
          termIndent: 3,
          definitionIndent: 6,
          inline: true,
          lines: [
            'An attacker may generate a bogus',
            'token or modify the token contents (such as the authentication or',
            'attribute statements) of an existing token, causing the resource',
            'server to grant inappropriate access to the client.  For example,',
            'an attacker may modify the token to extend the validity period; a',
            'malicious client may modify the assertion to gain access to',
            'information that they should not be able to view.',
          ],
        },
      ],
    };

    // Act
    const lines = renderDefinitionList(node);

    // Assert: first line stays inline with two spaces after the colon label
    expect(lines[0]).toBe('   Token manufacture/modification:  An attacker may generate a bogus');
    // Assert: continuation lines are indented to definitionIndent
    expect(lines[1]).toBe('      token or modify the token contents (such as the authentication or');
    expect(lines[2]).toBe('      attribute statements) of an existing token, causing the resource');
    expect(lines[3]).toBe('      server to grant inappropriate access to the client.  For example,');
    expect(lines[4]).toBe('      an attacker may modify the token to extend the validity period; a');
    expect(lines[5]).toBe('      malicious client may modify the assertion to gain access to');
    expect(lines[6]).toBe('      information that they should not be able to view.');
  });
});

