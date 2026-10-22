import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

const RecentItemsList = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No recent reports"
        description="You haven't reported any items lately. Start by reporting a found item to help the community."
        action={{
          label: "Report Item",
          onClick: () => window.location.href = '/report/new'
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map(item => (
        <Link
          key={item.id}
          to={`/items/${item.id}`}
          className="flex items-center justify-between p-4 bg-surface border border-line rounded-2xl hover:border-cobalt-300 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-line-50 flex items-center justify-center text-line-400 group-hover:text-cobalt-600 transition-colors">
              <Package size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-ink group-hover:text-cobalt-600 transition-colors">{item.title}</p>
              <p className="text-xs text-line-500 flex items-center gap-1">
                <Calendar size={12} />
                {format(new Date(item.created_at), 'PPP')}
              </p>
            </div>
          </div>
          <Badge className={cn("px-2 py-0.5 text-[10px]",
            item.status === 'open' ? 'bg-cobalt-100 text-cobalt-700' :
            item.status === 'claimed' ? 'bg-amber-100 text-amber-700' :
            item.status === 'returned' ? 'bg-found-100 text-found-700' : 'bg-line-100 text-line-600'
          )}>
            {item.status}
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export default RecentItemsList;
