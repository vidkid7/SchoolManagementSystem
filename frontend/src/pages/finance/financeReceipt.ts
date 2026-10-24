export interface FinanceReceiptField {
  label: string;
  value: string | number;
}

export interface FinanceReceipt {
  title: string;
  reference: string;
  fields: FinanceReceiptField[];
}

const escapeHtml = (value: string | number): string => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const createFinanceReceiptHtml = ({ title, reference, fields }: FinanceReceipt): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} — ${escapeHtml(reference)}</title>
    <style>
      body { font: 16px/1.5 Arial, sans-serif; color: #172033; margin: 2rem auto; max-width: 42rem; padding: 0 1rem; }
      h1 { font-size: 1.5rem; margin-bottom: .25rem; }
      .reference { color: #475569; margin-top: 0; }
      dl { border-top: 1px solid #cbd5e1; margin-top: 1.5rem; }
      .row { display: grid; grid-template-columns: 12rem 1fr; gap: 1rem; border-bottom: 1px solid #e2e8f0; padding: .75rem 0; }
      dt { color: #475569; } dd { margin: 0; overflow-wrap: anywhere; }
      button { margin-top: 1.5rem; padding: .6rem 1rem; }
      @media print { button { display: none; } body { margin: 0; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p class="reference">${escapeHtml(reference)}</p>
    <dl>${fields.map(({ label, value }) => `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
    <button type="button" onclick="window.print()">Print</button>
  </body>
</html>`;

export const openFinanceReceipt = (receipt: FinanceReceipt): void => {
  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) return;

  receiptWindow.opener = null;
  receiptWindow.document.open();
  receiptWindow.document.write(createFinanceReceiptHtml(receipt));
  receiptWindow.document.close();
};
