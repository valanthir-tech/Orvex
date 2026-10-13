/**
 * Nepal Localization Utilities for Onedexo ERP & Retail OS
 * - Currency formatting (formatNPR) with South Asian comma grouping
 * - Amount in words (formatAmountWords in English and Nepali)
 * - Bikram Sambat (BS) pure TypeScript lookup table (2070–2085 BS) and converter
 */

// ─── 1. Currency Formatting ──────────────────────────────────────────────────

/**
 * Formats a numeric amount into Nepali Rupees with South Asian comma grouping:
 * e.g. 123456.50 -> "Rs 1,23,456.50"
 */
export function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs 0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // South Asian grouping: last 3 digits, then groups of 2
  let result = '';
  if (integerPart.length <= 3) {
    result = integerPart;
  } else {
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);
    const groups: string[] = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      const start = Math.max(0, i - 2);
      groups.unshift(remaining.slice(start, i));
    }
    result = groups.join(',') + ',' + lastThree;
  }

  return `${isNegative ? '-' : ''}Rs ${result}.${decimalPart}`;
}

// ─── 2. Pure TypeScript BS Calendar (2070 - 2085 BS) ──────────────────────────

export interface BSDate {
  year: number;
  month: number; // 1-12 (Baisakh = 1)
  day: number;
}

export const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Asadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const BS_MONTH_NAMES_NE = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

// Days in each month for BS years 2070 - 2085
export const BS_CALENDAR_DATA: Record<number, number[]> = {
  2070: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2073: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2074: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2075: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2077: [31, 32, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 32, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31]
};

// Anchor: 2070 Baisakh 1 = 2013 April 14
const ANCHOR_BS_YEAR = 2070;
const ANCHOR_AD_DATE = new Date(Date.UTC(2013, 3, 14)); // 2013-04-14

/**
 * Converts AD Date to Bikram Sambat (BS)
 */
export function convertADtoBS(adDate: Date | string): BSDate {
  const targetDate = typeof adDate === 'string' ? new Date(adDate) : adDate;
  const utcTarget = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const utcAnchor = Date.UTC(ANCHOR_AD_DATE.getFullYear(), ANCHOR_AD_DATE.getMonth(), ANCHOR_AD_DATE.getDate());
  
  let totalDays = Math.floor((utcTarget - utcAnchor) / (1000 * 60 * 60 * 24));

  if (totalDays < 0) {
    return { year: 2070, month: 1, day: 1 };
  }

  let year = ANCHOR_BS_YEAR;
  let month = 1;
  let day = 1;

  while (year <= 2085) {
    const months = BS_CALENDAR_DATA[year];
    if (!months) break;

    const daysInYear = months.reduce((acc, curr) => acc + curr, 0);
    if (totalDays >= daysInYear) {
      totalDays -= daysInYear;
      year++;
    } else {
      for (let m = 0; m < 12; m++) {
        const daysInMonth = months[m];
        if (totalDays >= daysInMonth) {
          totalDays -= daysInMonth;
          month++;
        } else {
          day += totalDays;
          totalDays = 0;
          break;
        }
      }
      break;
    }
  }

  return { year, month, day };
}

/**
 * Converts BS Date to AD Date
 */
export function convertBStoAD(bsDate: BSDate): Date {
  let daysDiff = 0;

  for (let y = ANCHOR_BS_YEAR; y < bsDate.year; y++) {
    const months = BS_CALENDAR_DATA[y];
    if (months) {
      daysDiff += months.reduce((a, b) => a + b, 0);
    }
  }

  const currentYearMonths = BS_CALENDAR_DATA[bsDate.year] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
  for (let m = 1; m < bsDate.month; m++) {
    daysDiff += currentYearMonths[m - 1];
  }
  daysDiff += (bsDate.day - 1);

  const adTime = ANCHOR_AD_DATE.getTime() + (daysDiff * 24 * 60 * 60 * 1000);
  return new Date(adTime);
}

/**
 * Formats a Date into standard BS string e.g. "2081 Baisakh 15"
 */
export function formatBS(adDate: Date | string, lang: 'en' | 'ne' = 'en'): string {
  const bs = convertADtoBS(adDate);
  const monthName = lang === 'ne' ? BS_MONTH_NAMES_NE[bs.month - 1] : BS_MONTH_NAMES_EN[bs.month - 1];
  return `${bs.year} ${monthName} ${bs.day}`;
}

// ─── 3. Amount in Words ──────────────────────────────────────────────────────

const ONES_EN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const DIGITS_NE = [
  '', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ', 'दस',
  'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस', 'बीस',
  'एक्काइस', 'बाइस', 'तेइस', 'चौविस', 'पच्चिस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तिस', 'तीस',
  'एकतीस', 'बत्तीस', 'तेत्तिस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सरसर्तीस', 'अठतीस', 'उनन्चालीस', 'चालीस',
  'एकचालीस', 'बयालीस', 'त्रियालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सतचालीस', 'अठचालीस', 'उनन्चास', 'पचास',
  'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चवन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी', 'साठी',
  'एकसट्ठी', 'बासट्ठी', 'त्रिसट्ठी', 'चौंसट्ठी', 'पैंसट्ठी', 'छयसट्ठी', 'सतसट्ठी', 'अठसट्ठी', 'उनन्सत्तरी', 'सत्तरी',
  'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'असी',
  'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे', 'नब्बे',
  'एकान्नब्बे', 'बयानब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पन्चानब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनन्सय'
];

function convertBelowThousandEN(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES_EN[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS_EN[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES_EN[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts a numeric amount to words in English (with Lakh/Crore) or Nepali.
 * e.g. 2150.50 -> "Two Thousand One Hundred Fifty and 50/100 Only"
 * or "दुई हजार एक सय पचास रुपैयाँ पचास पैसा मात्र"
 */
export function formatAmountWords(amount: number, lang: 'en' | 'ne' = 'en'): string {
  if (isNaN(amount) || amount === 0) {
    return lang === 'ne' ? 'शून्य रुपैयाँ मात्र' : 'Zero Rupees Only';
  }

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const paisa = Math.round((absAmount - integerPart) * 100);

  if (lang === 'ne') {
    // Nepali South Asian decomposition
    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const hundred = Math.floor((integerPart % 1000) / 100);
    const rest = integerPart % 100;

    let parts: string[] = [];
    if (crore > 0) parts.push(`${DIGITS_NE[crore] || crore} करोड`);
    if (lakh > 0) parts.push(`${DIGITS_NE[lakh] || lakh} लाख`);
    if (thousand > 0) parts.push(`${DIGITS_NE[thousand] || thousand} हजार`);
    if (hundred > 0) parts.push(`${DIGITS_NE[hundred] || hundred} सय`);
    if (rest > 0) parts.push(`${DIGITS_NE[rest] || rest}`);

    let text = parts.join(' ') + ' रुपैयाँ';
    if (paisa > 0) {
      text += ` ${DIGITS_NE[paisa] || paisa} पैसा`;
    }
    return text + ' मात्र';
  }

  // English
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const rest = integerPart % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertBelowThousandEN(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertBelowThousandEN(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertBelowThousandEN(thousand)} Thousand`);
  if (rest > 0) parts.push(convertBelowThousandEN(rest));

  let text = parts.join(' ') + ' Rupees';
  if (paisa > 0) {
    text += ` and ${paisa}/100`;
  }
  return text + ' Only';
}
