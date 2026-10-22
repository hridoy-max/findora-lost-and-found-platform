

import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { Calendar, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '../ui/EmptyState';

const ClaimsList = ({
  claims = [],
  viewMode = 'claimant', // 'claimant' or 'reporter'
  onClaimClick = () => {}
}) => {
  if (!claims || claims.length === 0) {
    return (
      <EmptyState
        title={viewMode === 'reporter' ? "No claims to review" : "No claims found"}
        description={viewMode === 'reporter' ? "All your items are currently claim-free." : "You haven't claimed any items yet. Browse items to start."}
        action={{
          label: viewMode === 'reporter' ? "Browse Items" : "Explore Items",
          onClick: () => window.location.href = '/items'
        }}
      />
    );
  }

  const statusColors = {
    pending: 'bg-cobalt-100 text-cobalt-700 border-cobalt-200',
    approved: 'bg-found-100 text-found-700 border-found-200',
    rejected: 'bg-danger-100 text-danger-700 border-danger-200',
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {claims.map((claim) => (
        <div
          key={claim.id}
          onClick={() => onClaimClick(claim.id)}
          className="group p-4 bg-surface border border-line rounded-2xl hover:border-cobalt-300 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="hidden sm:block p-3 bg-line-50 rounded-xl text-line-400 group-hover:text-cobalt-600 transition-colors">
              {viewMode === 'reporter' ? <User size={20} /> : <PackageIcon size={20} />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-ink">
                  {viewMode === 'reporter' ? claim.claimant.full_name : claim.item.title}
                </span>
                <Badge className={cn("px-2 py-0.5 text-[10px] uppercase", statusColors[claim.status])}>
                  {claim.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-line-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {format(new Date(claim.created_at), 'PPP')}
                </span>
                {viewMode === 'reporter' && (
                  <span className="flex items-center gap-1">
                    <User size={12} /> {claim.claimant.full_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-line-300 group-hover:text-cobalt-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};

const PackageIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.5.73 9 5.15" />
    <path d="M12 12v4" />
    <path d="m12 16 4-2" />
    <path d="m12 16-4-2" />
  </svg>
);

export default ClaimsList;
