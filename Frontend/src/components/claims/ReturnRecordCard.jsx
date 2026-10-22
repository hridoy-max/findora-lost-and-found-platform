import React from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle } from 'lucide-react';

const ReturnRecordCard = ({ returnRecord }) => {
  if (!returnRecord) return null;

  return (
    <div className="bg-found-50 border border-found-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-found-600 text-surface rounded-full">
          <CheckCircle size={18} />
        </div>
        <h3 className="text-lg font-bold text-ink">Handover Completed</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-found-100">
          <div className="flex items-center gap-2 text-found-600">
            <Calendar size={16} />
            <span className="text-sm font-medium">Returned on</span>
          </div>
          <span className="text-sm font-bold text-ink">
            {format(new Date(returnRecord.returned_at), 'PPP')}
          </span>
        </div>

        {returnRecord.notes && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-found-600 uppercase tracking-wider">Handover Notes</p>
            <p className="text-sm text-ink leading-relaxed italic">
              "{returnRecord.notes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnRecordCard;
