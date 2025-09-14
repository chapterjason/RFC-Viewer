import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('DefinitionListMatcher', () => {
    it('parses a definition list with a wrapped description', () => {
        // Arrange
        const snippetWithContext = [
            '   client',
            '      An application making protected resource requests on behalf of the',
            '      resource owner and with its authorization.  The term "client" does',
            '      not imply any particular implementation characteristics (e.g.,',
            '      whether the application executes on a server, a desktop, or other',
            '      devices).',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: single DefinitionList node
        expect(kinds).toEqual(['DefinitionList']);
        const defList: any = doc.children[0];
        expect(defList.items.length).toBe(1);
        expect(defList.items[0].term).toBe('client');
        expect(defList.items[0].lines.length).toBe(5);
        expect(defList.items[0].definitionIndent).toBeGreaterThan(defList.items[0].termIndent);
    });

  it('parses multiple consecutive definitions as one list', () => {
        // Arrange
        const snippetWithContext = [
            '   client',
            '      The application...',
            '   authorization server',
            '      The server issuing access tokens...',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: DefinitionList then BlankLine
        expect(kinds).toEqual(['DefinitionList', 'BlankLine']);
        const defList: any = doc.children[0];
        expect(defList.items.length).toBe(2);
        expect(defList.items[0].term).toBe('client');
        expect(defList.items[1].term).toBe('authorization server');
  });

  it('detects template-style terms ending with colon followed by indented definition', () => {
    // Arrange: matches Registration Template style
    const snippetWithContext = [
      '   Error name:',
      '      The name requested (e.g., "example").',
      '      Values for the error name MUST NOT include characters',
      '      outside the set %x20-21 / %x23-5B / %x5D-7E.',
    ];

    // Act
    const doc = parse(new ArrayCursor(snippetWithContext));
    const kinds = doc.children.map((n: any) => n.type);

    // Assert: single DefinitionList node
    expect(kinds).toEqual(['DefinitionList']);
    const defList: any = doc.children[0];
    expect(defList.items.length).toBe(1);
    expect(defList.items[0].term).toBe('Error name:');
    expect(defList.items[0].lines.length).toBeGreaterThanOrEqual(3);
  });

  it('splits inline label with colon and two spaces into term and first definition line', () => {
    // Arrange: term and definition share the first line, with continuation below
    const snippetWithContext = [
      '   Token replay:  An attacker attempts to use a token that has already',
      '      been used with that resource server in the past.',
    ];

    // Act
    const doc = parse(new ArrayCursor(snippetWithContext));
    const kinds = doc.children.map((n: any) => n.type);

    // Assert
    expect(kinds).toEqual(['DefinitionList']);
    const defList: any = doc.children[0];
    expect(defList.items.length).toBe(1);
    const item = defList.items[0];
    expect(item.termIndent).toBe(3);
    expect(item.definitionIndent).toBeGreaterThan(item.termIndent);
    expect(item.term).toBe('Token replay:');
    expect(item.lines[0]).toBe('An attacker attempts to use a token that has already');
    expect(item.lines[1]).toBe('been used with that resource server in the past.');
  });

  it('allows slash in term labels and consumes wrapped indented lines as definition', () => {
    // Arrange: term contains a slash, followed by inline content and deeper-indented continuation
    const snippetWithContext = [
      '   Token manufacture/modification:  An attacker may generate a bogus',
      '      token or modify the token contents (such as the authentication or',
      '      attribute statements) of an existing token, causing the resource',
      '      server to grant inappropriate access to the client.  For example,',
      '      an attacker may modify the token to extend the validity period; a',
      '      malicious client may modify the assertion to gain access to',
      '      information that they should not be able to view.'
    ];

    // Act
    const doc = parse(new ArrayCursor(snippetWithContext));
    const kinds = doc.children.map((n: any) => n.type);

    // Assert
    expect(kinds).toEqual(['DefinitionList']);
    const defList: any = doc.children[0];
    expect(defList.items.length).toBe(1);
    const item = defList.items[0];
    expect(item.term).toBe('Token manufacture/modification:');
    expect(item.termIndent).toBe(3);
    expect(item.lines.length).toBeGreaterThan(3);
    expect(item.lines[0]).toBe('An attacker may generate a bogus');
  });

    it('parses nested definition items under a parent definition', () => {
        // Arrange: parent term with deeper child terms
        const snippetWithContext = [
            '   error',
            '         REQUIRED.  A single ASCII [USASCII] error code from the',
            '         following:',
            '         invalid_request',
            '               The request is missing a required parameter.',
            '         access_denied',
            '               The resource owner denied the request.',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: a single DefinitionList containing one parent with two children
        expect(kinds).toEqual(['DefinitionList']);
        const defList: any = doc.children[0];
        expect(defList.items.length).toBe(1);
        const parent = defList.items[0];
        expect(parent.term).toBe('error');
        expect(parent.children?.length).toBe(2);
        expect(parent.children?.map((c: any) => c.term)).toEqual(['invalid_request', 'access_denied']);
    });

    it('handles page breaks between nested definition items (RFC-like)', () => {
        // Arrange: parent, first child, page break + header, second child
        const snippetWithContext = [
            '   error',
            '      REQUIRED.  A single ASCII error code from the following:',
            '         invalid_request',
            '               The request is missing a required parameter.',
            '',
            'Hardt                        Standards Track                   [Page 27]',
            '\f',
            'RFC 6749                        OAuth 2.0                   October 2012',
            '',
            '         unauthorized_client',
            '               The client is not authorized to request an authorization',
            '               code using this method.',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: First DefinitionList up to page break, then PageBreak/Header, then another DefinitionList resumes
        expect(kinds).toEqual(['DefinitionList', 'BlankLine', 'PageFooter', 'PageBreak', 'PageHeader', 'BlankLine', 'DefinitionList']);
        const first: any = doc.children[0];
        expect(first.items[0].term).toBe('error');
        expect(first.items[0].children?.map((c: any) => c.term)).toEqual(['invalid_request']);
        const second: any = doc.children[6];
        expect(second.items[0].term).toBe('unauthorized_client');
    });
});
