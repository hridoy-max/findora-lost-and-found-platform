import React from 'react';
import { Link } from 'react-router-dom';
import { User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

const PendingClaimsSection = ({ claims }) => {
  if (!claims || claims.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-line-500 mb-2">
          <AlertCircle size={20} />
          <h3 className="font-bold text-sm">No pending claims</h3>
        </div>
        <p className="text-xs text-line-400">
          All your items are currently claim-free.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-amber-700 mb-2">
        <AlertCircle size={20} />
        <h3 className="font-bold">Claims waiting on your items</h3>
      </div>
      <div className="space-y-3">
        {claims.slice(0, 5).map(claim => (
          <Link
            key={claim.id}
            to={`/claims/${claim.id}`}
            className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-2xl hover:bg-amber-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                <User size={16} />
              </div>
              <div className="text-sm">
                <p className="font-bold text-ink group-hover:text-amber-700 transition-colors">
                  {claim.claimant.full_name}
                </p>
                <p className="text-xs text-line-500">
                  Submitted {format(new Date(claim.created_at), 'PPP')}
                </p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              Pending
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PendingClaimsSection;
