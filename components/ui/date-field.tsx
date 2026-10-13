'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ArrowLeftRight } from 'lucide-react';
import { convertADtoBS, convertBStoAD, formatBS, BS_MONTH_NAMES_EN, BS_CALENDAR_DATA } from '@/lib/nepal-localization';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface DateFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD (Gregorian)
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DateField({ label, value, onChange, disabled, className = '' }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ad' | 'bs'>('bs');

  const currentDate = value ? new Date(value) : new Date();
  const bsDate = convertADtoBS(currentDate);

  const [selectedBsYear, setSelectedBsYear] = useState<number>(bsDate.year);
  const [selectedBsMonth, setSelectedBsMonth] = useState<number>(bsDate.month);

  const handleBsDayClick = (day: number) => {
    const newBs = { year: selectedBsYear, month: selectedBsMonth, day };
    const newAd = convertBStoAD(newBs);
    const yyyy = newAd.getFullYear();
    const mm = String(newAd.getMonth() + 1).padStart(2, '0');
    const dd = String(newAd.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const daysInMonth = (BS_CALENDAR_DATA[selectedBsYear] && BS_CALENDAR_DATA[selectedBsYear][selectedBsMonth - 1]) || 30;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-text">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between text-left font-normal border-border bg-surface hover:bg-surface-elevated text-text px-3 py-2 h-10 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-text-muted" />
              <span className="font-medium text-text">{formatBS(currentDate)}</span>
              <span className="text-xs text-text-muted">({value || 'Select date'})</span>
            </div>
            <span className="text-[10px] font-semibold bg-surface-subtle text-text-muted px-1.5 py-0.5 rounded border border-border">
              BS / AD
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3 bg-surface border-border shadow-xl rounded-xl z-50">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <span className="text-xs font-bold text-text">Dual Nepal Calendar</span>
            <div className="flex gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('bs')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'bs' ? 'bg-primary text-text-inverted shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                BS (विक्रम संवत्)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ad')}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'ad' ? 'bg-primary text-text-inverted shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                AD (Gregorian)
              </button>
            </div>
          </div>

          {activeTab === 'bs' ? (
            <div className="space-y-3">
              {/* Year & Month picker */}
              <div className="flex gap-2">
                <select
                  value={selectedBsYear}
                  onChange={(e) => setSelectedBsYear(Number(e.target.value))}
                  className="w-1/2 text-xs border border-border rounded-lg bg-surface text-text p-1.5"
                >
                  {Object.keys(BS_CALENDAR_DATA).map((y) => (
                    <option key={y} value={y}>
                      {y} BS
                    </option>
                  ))}
                </select>
                <select
                  value={selectedBsMonth}
                  onChange={(e) => setSelectedBsMonth(Number(e.target.value))}
                  className="w-1/2 text-xs border border-border rounded-lg bg-surface text-text p-1.5"
                >
                  {BS_MONTH_NAMES_EN.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m} ({idx + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="text-[10px] font-bold text-text-muted py-1">
                    {d}
                  </span>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = bsDate.year === selectedBsYear && bsDate.month === selectedBsMonth && bsDate.day === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleBsDayClick(d)}
                      className={`h-8 w-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary text-text-inverted shadow-sm font-bold'
                          : 'hover:bg-surface-elevated text-text'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="date"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setOpen(false);
                }}
                className="w-full text-sm border border-border rounded-lg bg-surface text-text p-2"
              />
              <div className="text-xs text-text-muted bg-surface-subtle p-2 rounded-lg border border-border">
                Equivalent BS: <strong className="text-text">{formatBS(currentDate)}</strong>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
