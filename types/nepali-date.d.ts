declare module 'nepali-date' {
  export default class NepaliDate {
    constructor(date?: Date | string | number | NepaliDate);
    getYear(): number;
    getMonth(): number;
    getDate(): number;
    format(formatStr: string): string;
  }
}
