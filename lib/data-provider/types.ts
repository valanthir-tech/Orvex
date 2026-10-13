/**
 * DataProvider Types for Onedexo ERPNext Layer
 */

export type DocStatus = 0 | 1 | 2; // 0 = Draft, 1 = Submitted, 2 = Cancelled

export interface BaseDoc {
  name: string;
  docstatus: DocStatus;
  creation?: string;
  modified?: string;
  owner?: string;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  filters?: Record<string, any>;
}

export interface ListResult<T> {
  data: T[];
  total: number;
}

export interface DataProvider {
  list<T = any>(doctype: string, options?: ListOptions): Promise<ListResult<T>>;
  get<T = any>(doctype: string, name: string): Promise<T | null>;
  create<T = any>(doctype: string, data: Partial<T>): Promise<T>;
  update<T = any>(doctype: string, name: string, data: Partial<T>): Promise<T>;
  submit<T = any>(doctype: string, name: string): Promise<T>;
  cancel<T = any>(doctype: string, name: string): Promise<T>;
  report<T = any>(reportName: string, filters?: Record<string, any>): Promise<T>;
}
