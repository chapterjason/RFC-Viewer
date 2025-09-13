import {describe, expect, it} from 'vitest';
import {renderPageHeader} from '../src/Tree/Render/RenderPageHeader.js';
import {renderPageFooter} from '../src/Tree/Render/RenderPageFooter.js';
import type {PageHeaderNode} from '../src/Tree/Node/PageHeaderNode.js';
import type {PageFooterNode} from '../src/Tree/Node/PageFooterNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderPageHeaderFooter', () => {
    it('renders header and footer text on single lines', () => {
        // Arrange
        const header: PageHeaderNode = {
            type: 'PageHeader',
            position: makeRange(),
            text: 'RFC 9999  Example Header                       January 2099'
        };
        const footer: PageFooterNode = {
            type: 'PageFooter',
            position: makeRange(),
            text: 'Footer line before page break'
        };

        // Act
        const headerResult = renderPageHeader(header);
        const footerResult = renderPageFooter(footer);

        // Assert
        expect(headerResult).toEqual(['RFC 9999  Example Header                       January 2099']);
        expect(footerResult).toEqual(['Footer line before page break']);
    });
});

