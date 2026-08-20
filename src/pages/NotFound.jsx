import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c2i-paper)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--c2i-ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
        <p className="text-xl text-[var(--c2i-ink-soft)] mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[var(--c2i-red)] text-white px-6 py-3 rounded-lg font-bold hover:bg-[var(--c2i-red-deep)] transition-all"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
