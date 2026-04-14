export interface ReportCsvRow {
  event_type: string;
  event_date: string;
  amount: number;
  player_id: string | null;
}

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number.parseInt(match[1]!, 10);
  const monthIndex = Number.parseInt(match[2]!, 10) - 1;
  const day = Number.parseInt(match[3]!, 10);
  const date = new Date(year, monthIndex, day);

  return !Number.isNaN(date.getTime())
    && date.getFullYear() === year
    && date.getMonth() === monthIndex
    && date.getDate() === day;
}

export function parseReportCsv(csvData: string): ReportCsvRow[] {
  const lines = csvData
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Paste or upload at least one CSV row.');
  }

  return lines.map((line, index) => {
    const parts = line.split(',').map((value) => value.trim());
    if (parts.length < 3) {
      throw new Error(`Invalid CSV row at line ${index + 1}. Use event_type,event_date,amount[,player_id].`);
    }

    const [eventTypeRaw, eventDateRaw, amountRaw, playerIdRaw] = parts;
    const event_type = eventTypeRaw || 'ftd';
    const event_date = eventDateRaw || '';
    const amount = Number.parseFloat(amountRaw || '');

    if (!isValidIsoDate(event_date)) {
      throw new Error(`Invalid event date at line ${index + 1}. Use YYYY-MM-DD.`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid amount at line ${index + 1}. Amount must be greater than 0.`);
    }

    return {
      event_type,
      event_date,
      amount,
      player_id: playerIdRaw || null,
    };
  });
}
