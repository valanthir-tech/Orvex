// RULE BOUNDARY: This file exists to execute STRIKE PLAN Task 1.
// All dates sent to the API MUST be Gregorian UTC.
// This utility is EXCLUSIVELY for displaying Bikram Sambat in the React UI layer.

import NepaliDate from 'nepali-date';

const monthNames = [
  'Baisakh', 'Jestha', 'Asadh', 'Shrawan', 'Bhadra', 'Ashoj', 
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

/**
 * Converts a standard UTC/Gregorian Date into Bikram Sambat (BS) string.
 */
export function formatToBikramSambat(dateInput: Date | string | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const nd = new NepaliDate(d);
    
    // Safety extraction so we don't rely heavily on the library's internal formatter string logic
    const bsYear = nd.getYear();
    const bsMonthName = monthNames[nd.getMonth()];
    const bsDate = nd.getDate();
    
    return `${bsDate} ${bsMonthName} ${bsYear}`;
  } catch (error) {
    console.error("Nepali Date conversion failed:", error);
    // Graceful degradation back to standard locale date
    return new Date(dateInput).toLocaleDateString();
  }
}

/**
 * Returns today's date formatted as Bikram Sambat.
 */
export function getCurrentBikramSambat(): string {
  return formatToBikramSambat(new Date());
}
