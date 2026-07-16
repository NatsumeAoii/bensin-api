function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const BOM = "\uFEFF";
  const headerLine = headers.map(escapeCell).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCell).join(","));
  const csv = BOM + [headerLine, ...bodyLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
