import { useQuery } from '@tanstack/react-query';
import { getItems } from '../api/items';
import { getCategories } from '../api/categories';
import { Search, Filter } from 'lucide-react';
import { cn } from '../utils/cn';
import { normalizeList } from '../utils/normalizeList';
import { ItemCard } from '../components/items/ItemCard';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useListParams } from '../hooks/useListParams';

const BrowseItemsPage = () => {
  const { params, setParam, setParams } = useListParams({
    page: 1,
    page_size: 12,
    sort_by: 'created_at',
    order: 'desc',
  });

  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await getCategories();
      return normalizeList(res);
    },
  });

  const categories = Array.isArray(categoryData)
    ? categoryData
    : (categoryData?.data && Array.isArray(categoryData.data))
      ? categoryData.data
      : [];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['items', params],
    queryFn: async () => {
      const filteredParams = Object.fromEntries(
        Object.entries({
          page: params.page,
          page_size: params.page_size,
          search: params.search,
          item_type: params.item_type === 'all' ? '' : params.item_type,
          category_id: params.category_id === 'all' ? '' : params.category_id,
          status: params.status === 'all' ? '' : params.status,
          start_date: params.start_date,
          end_date: params.end_date,
          sort_by: params.sort_by,
          order: params.order,
        }).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      console.log('Fetching items with params:', filteredParams);
      const data = await getItems(filteredParams);
      return normalizeList(data);
    },
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.total_pages || 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headings font-bold text-ink">Browse Items</h1>
          <p className="text-ink/60">Search through the community's lost and found reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => {
            setParams({
              search: '',
              item_type: 'all',
              status: 'all',
              category_id: 'all',
            });
          }}>Clear All</Button>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-line shadow-sm space-y-6">
            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <Search size={16} /> Search
              </label>
              <Input
                placeholder="Title or ID..."
                value={params.search}
                onChange={e => setParam('search', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <Filter size={16} /> Category
              </label>
              <select
                value={params.category_id || 'all'}
                onChange={e => setParam('category_id', e.target.value === 'all' ? '' : e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-line bg-surface text-ink text-sm outline-none focus:ring-2 focus:ring-cobalt-500"
              >
                <option value="all">All Categories</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <Filter size={16} /> Item Type
              </label>
              <div className="flex flex-col gap-2">
                {['all', 'lost', 'found'].map(type => (
                  <button
                    key={type}
                    onClick={() => setParam('item_type', type)}
                    className={cn(
                      "text-left px-3 py-2 rounded-md text-sm transition-colors capitalize",
                      params.item_type === type ? "bg-cobalt text-surface" : "text-ink hover:bg-paper"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">Status</label>
              <div className="flex flex-col gap-2">
                {['all', 'open', 'claimed', 'returned'].map(status => (
                  <button
                    key={status}
                    onClick={() => setParam('status', status)}
                    className={cn(
                      "text-left px-3 py-2 rounded-md text-sm transition-colors capitalize",
                      params.status === status ? "bg-cobalt text-surface" : "text-ink hover:bg-paper"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section className="flex-1">
          {isLoading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-paper rounded-xl border border-line animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to load items"
              message="We couldn't fetch the reports. Please try again."
              onRetry={refetch}
            />
          ) : data?.length === 0 ? (
            <EmptyState
              title="No items match your search"
              description="Try adjusting your filters or clearing the search to find more reports."
              action={<Button onClick={() => setParam('search', '')}>Clear Search</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
              <Pagination
                totalPages={totalPages}
                currentPage={params.page}
                onPageChange={(p) => setParam('page', p)}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default BrowseItemsPage;
