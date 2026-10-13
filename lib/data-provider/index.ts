import { DataProvider } from './types';
import { MockAdapter } from './mock-adapter';
import { ERPNextAdapter } from './erpnext-adapter';

export * from './types';
export * from './mock-store';
export * from './mock-adapter';
export * from './erpnext-adapter';

// Singleton instances
const mockInstance = new MockAdapter();
const erpnextInstance = new ERPNextAdapter();

let currentMode: 'mock' | 'erpnext' = 'mock';

export function setDataProviderMode(mode: 'mock' | 'erpnext') {
  currentMode = mode;
}

export function getDataProviderMode(): 'mock' | 'erpnext' {
  return currentMode;
}

/**
 * Global getter for business entity data operations.
 * Components NEVER call fetch directly for business entities.
 */
export function getDataProvider(): DataProvider {
  if (currentMode === 'erpnext') {
    return erpnextInstance;
  }
  return mockInstance;
}
