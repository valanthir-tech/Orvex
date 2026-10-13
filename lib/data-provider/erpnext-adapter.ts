import { DataProvider, ListOptions, ListResult } from './types';

export class ERPNextAdapter implements DataProvider {
  private baseUrl = '/api/erp';

  async list<T = any>(doctype: string, options: ListOptions = {}): Promise<ListResult<T>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit_page_length', String(options.limit));
    if (options.page) params.set('limit_start', String(((options.page - 1) * (options.limit || 20))));
    if (options.search) params.set('filters', JSON.stringify([['name', 'like', `%${options.search}%`]]));

    const res = await fetch(`${this.baseUrl}/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`);
    if (!res.ok) throw new Error(`ERPNext list failed for ${doctype}: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data || [], total: json.data?.length || 0 };
  }

  async get<T = any>(doctype: string, name: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`ERPNext get failed: ${res.statusText}`);
    const json = await res.json();
    return json.data || null;
  }

  async create<T = any>(doctype: string, data: Partial<T>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/resource/${encodeURIComponent(doctype)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`ERPNext create failed: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  async update<T = any>(doctype: string, name: string, data: Partial<T>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`ERPNext update failed: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  async submit<T = any>(doctype: string, name: string): Promise<T> {
    return this.update<T>(doctype, name, { docstatus: 1 } as any);
  }

  async cancel<T = any>(doctype: string, name: string): Promise<T> {
    return this.update<T>(doctype, name, { docstatus: 2 } as any);
  }

  async report<T = any>(reportName: string, filters: Record<string, any> = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/method/frappe.desk.query_report.run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_name: reportName, filters }),
    });
    if (!res.ok) throw new Error(`ERPNext report failed: ${res.statusText}`);
    const json = await res.json();
    return json.message || json;
  }
}
