import { useSearchParams } from 'react-router-dom';

/**
 * Syncs a list's parameters with the URL query string.
 */
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = {
    page: parseInt(searchParams.get('page') || defaults.page || '1', 10),
    page_size: parseInt(searchParams.get('page_size') || defaults.page_size || '12', 10),
    search: searchParams.get('search') || '',
    item_type: searchParams.get('item_type') || defaults.item_type || 'all',
    category_id: searchParams.get('category_id') || '',
    status: searchParams.get('status') || defaults.status || 'all',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    sort_by: searchParams.get('sort_by') || defaults.sort_by || 'created_at',
    order: searchParams.get('order') || defaults.order || 'desc',
  };

  const setParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value !== undefined && value !== null && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    // Reset page to 1 when a filter changes
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  return { params, setParam };
}
