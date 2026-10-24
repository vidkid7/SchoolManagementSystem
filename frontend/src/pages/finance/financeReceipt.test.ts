import { createFinanceReceiptHtml } from './financeReceipt';

describe('finance receipt document', () => {
  it('escapes labels and values before writing them into printable HTML', () => {
    const html = createFinanceReceiptHtml({
      title: '<script>alert(1)</script>',
      reference: 'INV-"QA"',
      fields: [{ label: 'Student', value: '<img src=x onerror=alert(1)>' }],
    });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('INV-&quot;QA&quot;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });
});
