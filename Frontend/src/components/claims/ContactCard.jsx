import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const ContactCard = ({ contact, role }) => {
  if (!contact) return null;

  return (
    <div className="bg-cobalt-50 border border-cobalt-100 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-cobalt-600 text-surface rounded-full">
          <User size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wider">Contact Details</p>
          <h4 className="text-lg font-bold text-ink">{contact.full_name}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-3 p-3 bg-white border border-cobalt-100 rounded-xl hover:border-cobalt-300 transition-colors group"
        >
          <Mail size={16} className="text-cobalt-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm text-ink">{contact.email}</span>
        </a>
        <a
          href={`tel:${contact.phone}`}
          className="flex items-center gap-3 p-3 bg-white border border-cobalt-100 rounded-xl hover:border-cobalt-300 transition-colors group"
        >
          <Phone size={16} className="text-cobalt-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm text-ink">{contact.phone}</span>
        </a>
      </div>
    </div>
  );
};

export default ContactCard;
