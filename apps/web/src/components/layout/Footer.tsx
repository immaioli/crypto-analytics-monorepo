import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <span>&copy; {currentYear} Crypto Analytics.</span>
        <span>Made by <a href="https://maio.maioli.dev.br" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">Irineu Marcelo MAIOLI</a>.</span>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://github.com/vmaioli/crypto-analytics-monorepo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          GitHub Repository
        </a>
        <span>&bull;</span>
        <a
          href="https://maioli.dev.br"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          maioli.dev.br
        </a>
      </div>
    </footer>
  );
}
