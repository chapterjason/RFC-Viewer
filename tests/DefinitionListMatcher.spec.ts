import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {DefinitionListNode} from "../src/Tree/Node/DefinitionListNode";

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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(1);
        expect(defList.items[0].termLines).toEqual(['client']);
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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(2);
        expect(defList.items[0].termLines).toEqual(['client']);
        expect(defList.items[1].termLines).toEqual(['authorization server']);
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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(1);
        expect(defList.items[0].termLines).toEqual(['Error name:']);
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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(1);
        const item = defList.items[0];
        expect(item.termIndent).toBe(3);
        expect(item.definitionIndent).toBeGreaterThan(item.termIndent);
        expect(item.termLines).toEqual(['Token replay:']);
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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(1);
        const item = defList.items[0];
        expect(item.termLines).toEqual(['Token manufacture/modification:']);
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
        const defList: DefinitionListNode = doc.children[0];
        expect(defList.items.length).toBe(1);
        const parent = defList.items[0];
        expect(parent.termLines).toEqual(['error']);
        expect(parent.children?.length).toBe(2);
        expect(parent.children?.map((c: any) => c.termLines)).toEqual([['invalid_request'], ['access_denied']]);
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
        const first: DefinitionListNode = doc.children[0];
        expect(first.items[0].termLines).toEqual(['error']);
        expect(first.items[0].children?.map((c: any) => c.termLines)).toEqual([['invalid_request']]);
        const second: DefinitionListNode = doc.children[6];
        expect(second.items[0].termLines).toEqual(['unauthorized_client']);
    });

    it('handles term on multiple lines', () => {
        // Arrange: term, text, blank line, term on 2 lines, text
        const snippetWithContext = [
            "   A counter.  This monotonic value can be thought of as a \"randomly",
            "   seeded counter\" that MUST be incremented in the least significant",
            "",
            "   Monotonic Random (Method 2):",
            "      With this method, the random data is extended to also function as",
            "      a counter.  This monotonic value can be thought of as a \"randomly",
            "      seeded counter\" that MUST be incremented in the least significant",
            "      position for each UUID created on a given timestamp tick.",
            "      UUIDv7's rand_b section SHOULD be utilized with this method to",
            "      handle batch UUID generation during a single timestamp tick.  The",
            "      increment value for every UUID generation is a random integer of",
            "      any desired length larger than zero.  It ensures that the UUIDs",
            "      retain the required level of unguessability provided by the",
            "      underlying entropy.  The increment value MAY be 1 when the number",
            "      of UUIDs generated in a particular period of time is important and",
            "      guessability is not an issue.  However, incrementing the counter",
            "      by 1 SHOULD NOT be used by implementations that favor",
            "      unguessability, as the resulting values are easily guessable.",
            "",
            "   Replace Leftmost Random Bits with Increased Clock Precision",
            "   (Method 3):",
            "      For UUIDv7, which has millisecond timestamp precision, it is",
            "      possible to use additional clock precision available on the system",
            "      to substitute for up to 12 random bits immediately following the",
            "      timestamp.  This can provide values that are time ordered with",
            "      sub-millisecond precision, using however many bits are appropriate",
            "      in the implementation environment.  With this method, the",
            "      additional time precision bits MUST follow the timestamp as the",
            "      next available bit in the rand_a field for UUIDv7.",
            "",
            "   A counter.  This monotonic value can be thought of as a \"randomly",
            "   seeded counter\" that MUST be incremented in the least significant",
        ];

        // Act
        const documentNode = parse(new ArrayCursor(snippetWithContext));
        const kinds = documentNode.children.map((node: any) => node.type);

        // Assert: First DefinitionList up to page break, then PageBreak/Header, then another DefinitionList resumes
        expect(kinds).toEqual([
            'Paragraph',
            'BlankLine',
            'DefinitionList',
            'BlankLine',
            'DefinitionList',
            'BlankLine',
            'Paragraph',
        ]);
        // Assert both of the terms:
        expect((documentNode.children[2] as DefinitionListNode).items[0].termLines).toEqual(["Monotonic Random (Method 2):"]);
        expect((documentNode.children[4] as DefinitionListNode).items[0].termLines).toEqual([
            "Replace Leftmost Random Bits with Increased Clock Precision",
            "(Method 3):"
        ]);
    });
});
