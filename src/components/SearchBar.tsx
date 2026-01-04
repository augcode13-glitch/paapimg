import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-4xl">
      <div className="relative">
        <Search className="absolute left-3 xs:left-4 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search photos... (nature, architecture, etc.)"
          className="w-full pl-9 xs:pl-12 pr-9 xs:pr-12 py-2.5 xs:py-4 bg-zinc-800/50 backdrop-blur-md border border-zinc-700 rounded-xl xs:rounded-2xl text-sm xs:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200"
          >
            <X className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
