import type { InvoiceView } from "../backend.d";
import {
  calculateInvoiceTotal,
  formatCurrency,
  formatDate,
  formatInvoiceId,
} from "./format";

function buildGstRows(invoice: InvoiceView, subtotal: number): string {
  if (!invoice.gstEnabled) return "";
  const gstAmt = Number(invoice.gstAmount);
  const total = Number(invoice.total);
  const pct =
    invoice.gstPercentage !== undefined ? Number(invoice.gstPercentage) : 0;
  return `
    <tr>
      <td colspan="3" style="text-align: right; color: #6b7280;">Subtotal</td>
      <td class="amount">${formatCurrency(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="3" style="text-align: right; color: #6b7280;">GST (${pct}%)</td>
      <td class="amount">${formatCurrency(gstAmt)}</td>
    </tr>
    <tr class="total-row">
      <td colspan="3" style="text-align: right; font-weight: 700;">Total (incl. GST)</td>
      <td class="amount">${formatCurrency(total)}</td>
    </tr>`;
}

function buildGstRowsPrint(invoice: InvoiceView, subtotal: number): string {
  if (!invoice.gstEnabled) return "";
  const gstAmt = Number(invoice.gstAmount);
  const total = Number(invoice.total);
  const pct =
    invoice.gstPercentage !== undefined ? Number(invoice.gstPercentage) : 0;
  return `
      <tr>
        <td colspan="3" class="right muted">Subtotal</td>
        <td class="right">${formatCurrency(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="3" class="right muted">GST (${pct}%)</td>
        <td class="right">${formatCurrency(gstAmt)}</td>
      </tr>
      <tr class="total">
        <td colspan="3" class="right">Total (incl. GST)</td>
        <td class="right">${formatCurrency(total)}</td>
      </tr>`;
}

export function useDownloadInvoice() {
  return function downloadInvoice(invoice: InvoiceView) {
    const subtotal = calculateInvoiceTotal(invoice.services);
    const displayTotal = invoice.gstEnabled ? Number(invoice.total) : subtotal;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${formatInvoiceId(invoice.id)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: 700; color: #1a6b78; }
    .invoice-meta { text-align: right; }
    .invoice-id { font-size: 20px; font-weight: 700; color: #1a6b78; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; margin-bottom: 8px; }
    .patient-name { font-size: 18px; font-weight: 600; }
    .dates { display: flex; gap: 40px; margin-top: 16px; }
    .date-item label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td.amount { text-align: right; font-weight: 600; font-family: monospace; }
    .total-row { font-weight: 700; font-size: 16px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MedInvoice Pro</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Medical Billing System</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-id">${formatInvoiceId(invoice.id)}</div>
      <span class="status-badge status-${invoice.status}">${invoice.status}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bill To</div>
    <div class="patient-name">${invoice.patientName}</div>
    <div class="dates">
      <div class="date-item">
        <label>Issue Date</label>
        <strong>${formatDate(invoice.issueDate)}</strong>
      </div>
      <div class="date-item">
        <label>Due Date</label>
        <strong>${formatDate(invoice.dueDate)}</strong>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Services &amp; Medicines</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.services
          .map(
            (s) => `
          <tr>
            <td>${s.name}</td>
            <td class="amount">${s.quantity}</td>
            <td class="amount">${formatCurrency(Number(s.unitPrice))}</td>
            <td class="amount">${formatCurrency(Number(s.quantity) * Number(s.unitPrice))}</td>
          </tr>
        `,
          )
          .join("")}
        ${
          invoice.gstEnabled
            ? buildGstRows(invoice, subtotal)
            : `<tr class="total-row">
              <td colspan="3" style="text-align: right; font-weight: 700;">Total</td>
              <td class="amount">${formatCurrency(displayTotal)}</td>
            </tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by MedInvoice Pro · ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formatInvoiceId(invoice.id)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

export function usePrintInvoice() {
  return function printInvoice(invoice: InvoiceView) {
    const subtotal = calculateInvoiceTotal(invoice.services);
    const displayTotal = invoice.gstEnabled ? Number(invoice.total) : subtotal;
    const win = window.open("", "_blank");
    if (!win) return;

    const content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${formatInvoiceId(invoice.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #1a6b78; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 700; color: #1a6b78; }
    .logo-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .invoice-id { font-size: 20px; font-weight: 700; color: #1a6b78; text-align: right; }
    .status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-sent { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 28px; }
    .meta-block { }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .meta-value { font-size: 16px; font-weight: 600; }
    .meta-date { font-size: 13px; margin-bottom: 8px; }
    .meta-date span { color: #6b7280; font-size: 11px; display: block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    thead th { background: #f3f4f6; padding: 9px 10px; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; border: 1px solid #e5e7eb; text-align: left; }
    thead th.right { text-align: right; }
    tbody td { padding: 10px; border: 1px solid #e5e7eb; font-size: 13px; vertical-align: top; }
    td.right { text-align: right; font-family: monospace; }
    td.muted { color: #6b7280; }
    tr.total td { font-weight: 700; font-size: 15px; border-top: 2px solid #1a6b78; background: #f0fdfa; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { border-bottom-color: #1a6b78; }
      thead th { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr.total td { background: #f0fdfa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      a { text-decoration: none; color: inherit; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MedInvoice Pro</div>
      <div class="logo-sub">Medical Billing System</div>
    </div>
    <div>
      <div class="invoice-id">${formatInvoiceId(invoice.id)}</div>
      <span class="status status-${invoice.status}">${invoice.status}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <div class="meta-label">Bill To</div>
      <div class="meta-value">${invoice.patientName}</div>
    </div>
    <div class="meta-block" style="text-align: right;">
      <div class="meta-date"><span>Issue Date</span>${formatDate(invoice.issueDate)}</div>
      <div class="meta-date"><span>Due Date</span>${formatDate(invoice.dueDate)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item / Service</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.services
        .map(
          (s) => `
      <tr>
        <td>${s.name}</td>
        <td class="right">${s.quantity}</td>
        <td class="right">${formatCurrency(Number(s.unitPrice))}</td>
        <td class="right">${formatCurrency(Number(s.quantity) * Number(s.unitPrice))}</td>
      </tr>`,
        )
        .join("")}
      ${
        invoice.gstEnabled
          ? buildGstRowsPrint(invoice, subtotal)
          : `<tr class="total">
          <td colspan="3" class="right">Total</td>
          <td class="right">${formatCurrency(displayTotal)}</td>
        </tr>`
      }
    </tbody>
  </table>

  <div class="footer">
    Generated by MedInvoice Pro &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    win.document.write(content);
    win.document.close();
  };
}
