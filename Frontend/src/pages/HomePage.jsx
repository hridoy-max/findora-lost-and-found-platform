import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Package, PlusCircle } from 'lucide-react';

const HomePage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/items?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-surface border-b border-line py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-headings font-bold text-ink mb-6 leading-tight">
            Find what you <span className="text-cobalt">lost</span>, <br />
            report what you <span className="text-found">found</span>.
          </h1>
          <p className="text-xl text-ink/60 mb-10 max-w-xl mx-auto">
            The community-driven lost and found board. Search reports or help someone get their belongings back.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 group-focus-within:text-cobalt transition-colors">
              <Search size={20} />
            </div>
            <Input 
              className="pl-12 py-4 text-lg rounded-full border-line focus:ring-cobalt/20"
              placeholder="Search by title, description, or report ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 py-2"
            >
              Search
            </Button>
          </form>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button 
              variant="secondary" 
              className="px-6 py-3 rounded-full flex items-center gap-2"
              onClick={() => navigate('/report?type=lost')}
            >
              <PlusCircle size={18} /> I lost something
            </Button>
            <Button 
              variant="primary" 
              className="px-6 py-3 rounded-full flex items-center gap-2"
              onClick={() => navigate('/report?type=found')}
            >
              <PlusCircle size={18} /> I found something
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-headings font-bold text-ink">Recent Reports</h2>
            <p className="text-ink/60">The latest items reported by the community</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/items')} className="text-sm">
            View All Items
          </Button>
        </div>
        
        {/* ItemGrid will go here in a later step */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-paper rounded-xl border border-line animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
