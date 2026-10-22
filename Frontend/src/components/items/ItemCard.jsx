import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Calendar, MapPin, Tag } from 'lucide-react';

const ItemCard = ({ item }) => {
  // Status colors from spec
  const statusStyles = {
    open: 'bg-cobalt/10 text-cobalt border-cobalt/30',
    claimed: 'bg-amber-100 text-amber-800 border-amber-200',
    returned: 'bg-found text-surface border-found',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const typeColors = {
    lost: 'text-lost',
    found: 'text-found',
  };

  return (
    <Link to={`/items/${item.id}`} className="group block h-full">
      <div className="relative h-full bg-surface rounded-xl border border-line overflow-hidden transition-all hover:border-cobalt hover:shadow-md group-hover:-translate-y-1 duration-200">
        {/* Image Section */}
        <div className="aspect-[4/3] overflow-hidden bg-paper relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-line">
              <span className="text-xs uppercase font-medium">No Image</span>
            </div>
          )}

          {/* Item Type Badge (Top Left) */}
          <div className={cn(
            "absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface/90 backdrop-blur-sm border border-line shadow-sm",
            typeColors[item.item_type]
          )}>
            {item.item_type}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headings font-bold text-ink truncate pr-2 group-hover:text-cobalt transition-colors">
              {item.title}
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-ink/60 text-xs">
              <MapPin size={14} />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-ink/60 text-xs">
              <Calendar size={14} />
              <span>{item.event_date}</span>
            </div>
            <div className="flex items-center gap-2 text-ink/60 text-xs">
              <Tag size={14} />
              <span>{item.category?.name}</span>
            </div>
          </div>

          {/* THE CLAIM TAG: Custom design with notched edge and status stub */}
          <div className="relative mt-6 flex items-center">
            {/* The Notch/Stub */}
            <div className={cn(
              "absolute -left-1 top-0 bottom-0 w-1 rounded-r-full border-l-0",
              statusStyles[item.status]?.split(' ')[0] || 'bg-gray-400'
            )} />

            <div className={cn(
              "flex-1 py-1.5 px-3 rounded-r-lg border-l-0 text-xs font-medium flex justify-between items-center transition-colors",
              statusStyles[item.status] || "bg-gray-100 text-gray-600 border-gray-200"
            )}>
              <span>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
              <span className="opacity-60 text-[10px]">Report</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export { ItemCard };
export default ItemCard;
