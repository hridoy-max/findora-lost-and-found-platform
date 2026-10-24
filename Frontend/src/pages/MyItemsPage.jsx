import { useQuery } from '@tanstack/react-query';
import { getMyItems } from '../api/items';
import { Search, Package, Edit3, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { normalizeList } from '../utils/normalizeList';
import { ItemCard } from '../components/items/ItemCard';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useListParams } from '../hooks/useListParams';

const MyItemsPage = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams({
    page: 1,
    page_size: 12,
    sort_by: 'created_at',
    order: 'desc',
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-items', params],
    queryFn: async () => {
      const filteredParams = Object.fromEntries(
        Object.entries({
          page: params.page,
          page_size: params.page_size,
          search: params.search,
          status: params.status === 'all' ? '' : params.status,
          sort_by: params.sort_by,
          order: params.order,
        }).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      const res = await getMyItems(filteredParams);
      return normalizeList(res);
    },
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.total_pages || 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headings font-bold text-ink">My Reports</h1>
          <p className="text-ink/60">Manage the items you have reported to the community</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/report/new')}>
          <Package className="w-4 h-4 mr-2" />
          Report New Item
        </Button>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-line shadow-sm space-y-6">
            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <Search size={16} /> Search My Items
              </label>
              <Input
                placeholder="Title or ID..."
                value={params.search}
                onChange={e => setParam('search', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-ink mb-3 flex items-center gap-2">Status</label>
              <div className="flex flex-col gap-2">
                {['all', 'open', 'claimed', 'returned', 'closed'].map(status => (
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

        <section className="flex-1">
          {isLoading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-paper rounded-xl border border-line animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to load your reports"
              message="We couldn't fetch your items. Please try again."
              onRetry={refetch}
            />
          ) : data?.length === 0 ? (
            <EmptyState
              title="No reports found"
              description="You haven't reported any items that match these filters."
              action={<Button onClick={() => navigate('/report/new')}>Report an Item</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map(item => (
                  <div key={item.id} className="group relative">
                    <ItemCard item={item} />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => navigate(`/report/edit/${item.id}`)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-danger"
                        onClick={() => navigate(`/items/${item.id}`)}
                      >
                        <XCircle size={14} />
                      </Button>
                    </div>
                  </div>
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

export default MyItemsPage;
