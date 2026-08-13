import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import dayjs from 'dayjs';
import type { Account, Category, Transaction } from '../types/models';
import { formatCents } from './money';

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildRows(
  transactions: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>
) {
  return transactions.map((t) => ({
    date: dayjs(t.date.toDate()).format('YYYY-MM-DD HH:mm'),
    type: t.type === 'income' ? 'รายรับ' : t.type === 'expense' ? 'รายจ่าย' : 'โอนเงิน',
    category: t.categoryId ? (categories.get(t.categoryId)?.name ?? '-') : '-',
    account: accounts.get(t.accountId)?.name ?? '-',
    toAccount: t.toAccountId ? (accounts.get(t.toAccountId)?.name ?? '-') : '',
    amount: formatCents(t.amountCents, t.currency),
    note: t.note ?? '',
  }));
}

export async function exportTransactionsToCsv(
  transactions: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>
) {
  const rows = buildRows(transactions, categories, accounts);
  const header = ['วันที่', 'ประเภท', 'หมวดหมู่', 'บัญชี', 'บัญชีปลายทาง', 'จำนวนเงิน', 'โน้ต'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.date, r.type, r.category, r.account, r.toAccount, r.amount, r.note]
        .map(csvEscape)
        .join(',')
    ),
  ];
  const csvContent = '﻿' + lines.join('\n');

  const fileUri = `${FileSystem.cacheDirectory}transactions-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  }
  return fileUri;
}

export async function exportTransactionsToPdf(
  transactions: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>,
  title: string
) {
  const rows = buildRows(transactions, categories, accounts);
  const rowsHtml = rows
    .map(
      (r) => `<tr>
        <td>${r.date}</td>
        <td>${r.type}</td>
        <td>${r.category}</td>
        <td>${r.account}${r.toAccount ? ' → ' + r.toAccount : ''}</td>
        <td style="text-align:right">${r.amount}</td>
        <td>${r.note}</td>
      </tr>`
    )
    .join('');

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, sans-serif;">
        <h2>${title}</h2>
        <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="6">
          <thead>
            <tr>
              <th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>บัญชี</th><th>จำนวนเงิน</th><th>โน้ต</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
  return uri;
}
