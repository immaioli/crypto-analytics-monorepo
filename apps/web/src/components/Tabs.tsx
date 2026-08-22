'use client';

import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Must match the Tailwind `md` breakpoint (768px). The user asked for a
// dropdown below 800px; 800 is between `sm` and `md`, so we keep it as an
// explicit constant instead of pretending it is a stock breakpoint.
const DESKTOP_TABS_MIN_WIDTH = '(min-width: 800px)';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
}

export function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs && tabs.length > 0 && tabs[0] ? tabs[0].id : '')
  );
  const isDesktop = useMediaQuery(DESKTOP_TABS_MIN_WIDTH);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeLabel = activeTab?.label ?? '';

  return (
    <div className="w-full">
      {isDesktop ? (
        <div
          className="flex space-x-1 border-b border-slate-800"
          role="tablist"
          aria-orientation="horizontal"
        >
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  px-4 py-2 text-sm font-medium transition-colors border-b-2 outline-none
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : (
        <select
          aria-label="Select analytics tab"
          value={activeTabId}
          onChange={(event) => setActiveTabId(event.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      )}
      <div className="mt-4">
        {/* A11y roles differ per layout: the tablist owns `role=tab` buttons,
            while the native `<select>` carries the selection state itself. */}
        {isDesktop
          ? tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  role="tabpanel"
                  id={`panel-${tab.id}`}
                  aria-labelledby={`tab-${tab.id}`}
                  className={`w-full outline-none focus:ring-0 ${!isActive ? 'opacity-0 pointer-events-none absolute h-0 overflow-hidden -z-10' : 'relative z-0 h-auto'}`}
                  tabIndex={0}
                >
                  {tab.content}
                </div>
              );
            })
          : activeTab && (
              <div key={activeTab.id} tabIndex={0} className="w-full outline-none focus:ring-0">
                {activeTab.content}
              </div>
            )}
      </div>
    </div>
  );
}
