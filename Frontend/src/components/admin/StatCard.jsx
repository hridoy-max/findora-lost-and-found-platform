import React from 'react';
import { User, Activity, Package, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

const StatCard = ({ label, value, icon: Icon, className }) => {
  return (
    <div className={cn(
      "bg-surface border border-line rounded-3xl p-6 shadow-sm flex items-center gap-4 transition-all hover:border-cobalt-200",
      className
    )}>
      <div className="p-3 bg-cobalt-50 text-cobalt-600 rounded-2xl">
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <p className="text-xs font-semibold text-line-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
