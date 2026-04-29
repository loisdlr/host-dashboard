import { Platform } from "react-native";

export interface PdfExportOptions {
  html: string;
  filename?: string;
}

export async function exportPdf({ html, filename = "document.pdf" }: PdfExportOptions): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    const win = window.open("", "_blank");
    if (!win) {
      throw new Error("Pop-up blocked. Allow pop-ups to export the PDF.");
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        // ignore
      }
    }, 400);
    return;
  }

  const Print = await import("expo-print");
  const Sharing = await import("expo-sharing");
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: filename,
      UTI: "com.adobe.pdf",
    });
  }
}

interface BookingRow {
  date: string;
  guest: string;
  channel: string;
  nights: number;
  amount: string;
}

interface ExpenseRow {
  date: string;
  category: string;
  description: string;
  amount: string;
}

export interface IncomeStatementInput {
  unitName: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  totalIncome: string;
  totalExpenses: string;
  netProfit: string;
  investorPct: number;
  operatorPct: number;
  investorShare: string;
  operatorShare: string;
  generatedOn: string;
  netNegative: boolean;
}

export function buildIncomeStatementHtml(d: IncomeStatementInput): string {
  const bookingRows = d.bookings.length
    ? d.bookings
        .map(
          (b) => `
            <tr>
              <td>${escape(b.date)}</td>
              <td>${escape(b.guest)}</td>
              <td>${escape(b.channel)}</td>
              <td class="num">${b.nights}</td>
              <td class="num">${escape(b.amount)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="empty">No bookings in this period.</td></tr>`;

  const expenseRows = d.expenses.length
    ? d.expenses
        .map(
          (e) => `
            <tr>
              <td>${escape(e.date)}</td>
              <td>${escape(e.category)}</td>
              <td>${escape(e.description || "—")}</td>
              <td class="num">${escape(e.amount)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="empty">No expenses recorded.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escape(d.unitName)} — Income Statement</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #111;
    margin: 0;
    padding: 32px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    border-bottom: 3px solid #0E7C7B;
    padding-bottom: 16px;
    margin-bottom: 22px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand {
    color: #0E7C7B;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  h1 {
    margin: 6px 0 0;
    font-size: 26px;
    font-weight: 700;
    color: #111;
  }
  .meta {
    text-align: right;
    color: #555;
    font-size: 11px;
    line-height: 1.5;
  }
  .period {
    background: #FBFAF7;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 22px;
    display: flex;
    gap: 24px;
    font-size: 12px;
    color: #444;
  }
  .period strong { color: #111; display: block; font-size: 14px; margin-top: 2px; }
  h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #0E7C7B;
    margin: 26px 0 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
  }
  th, td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #eee;
  }
  th {
    background: #FBFAF7;
    color: #555;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.6px;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .empty { text-align: center; color: #888; font-style: italic; padding: 18px; }
  .summary {
    margin-top: 30px;
    border: 1px solid #eee;
    border-radius: 12px;
    overflow: hidden;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 18px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
  }
  .summary-row:last-child { border-bottom: none; }
  .summary-row.total {
    background: #0E7C7B;
    color: #fff;
    font-weight: 700;
    font-size: 16px;
  }
  .summary-row.subtotal { background: #FBFAF7; font-weight: 600; }
  .split {
    margin-top: 22px;
    display: flex;
    gap: 14px;
  }
  .split-box {
    flex: 1;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 16px;
  }
  .split-box.investor { background: rgba(14,124,123,0.08); border-color: rgba(14,124,123,0.25); }
  .split-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #555;
    margin-bottom: 6px;
  }
  .split-amount {
    font-size: 22px;
    font-weight: 700;
    color: #0E7C7B;
  }
  .split-box.operator .split-amount { color: #B45309; }
  .net-negative .summary-row.total { background: #B91C1C; }
  .net-negative .split-box.investor .split-amount { color: #B91C1C; }
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid #eee;
    color: #888;
    font-size: 10px;
    text-align: center;
  }
  @media print {
    body { padding: 18mm; }
    button { display: none; }
  }
</style>
</head>
<body class="${d.netNegative ? "net-negative" : ""}">
  <div class="header">
    <div>
      <div class="brand">Cozy Manhattan · Investor Statement</div>
      <h1>${escape(d.unitName)}</h1>
    </div>
    <div class="meta">
      Generated ${escape(d.generatedOn)}<br/>
      Investor copy
    </div>
  </div>

  <div class="period">
    <div>
      Period
      <strong>${escape(d.periodLabel)}</strong>
    </div>
    <div>
      Range
      <strong>${escape(d.startDate)} → ${escape(d.endDate)}</strong>
    </div>
  </div>

  <h2>Bookings</h2>
  <table>
    <thead>
      <tr>
        <th>Check-in</th>
        <th>Guest</th>
        <th>Channel</th>
        <th class="num">Nights</th>
        <th class="num">Income</th>
      </tr>
    </thead>
    <tbody>${bookingRows}</tbody>
  </table>

  <h2>Expenses</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${expenseRows}</tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Gross income</span>
      <span>${escape(d.totalIncome)}</span>
    </div>
    <div class="summary-row">
      <span>Total expenses</span>
      <span>- ${escape(d.totalExpenses)}</span>
    </div>
    <div class="summary-row total">
      <span>Net profit</span>
      <span>${escape(d.netProfit)}</span>
    </div>
  </div>

  <div class="split">
    <div class="split-box investor">
      <div class="split-label">Investor share (${d.investorPct}%)</div>
      <div class="split-amount">${escape(d.investorShare)}</div>
    </div>
    <div class="split-box operator">
      <div class="split-label">Operator share (${d.operatorPct}%)</div>
      <div class="split-amount">${escape(d.operatorShare)}</div>
    </div>
  </div>

  <div class="footer">
    Cozy Manhattan · Confidential — for investor use only.
  </div>
</body>
</html>`;
}

function escape(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
