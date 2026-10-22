import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CheckCircle, Info } from 'lucide-react';

const RecordReturnDialog = ({
  onClose,
  onSuccess,
  isPending = false
}) => {
  const [notes, setNotes] = useState('');

  return (
    <Modal title="Record Handover" onClose={onClose}>
      <div className="space-y-6">
        <div className="bg-cobalt-50 border border-cobalt-100 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-cobalt-600 shrink-0" />
          <p className="text-sm text-cobalt-700 leading-relaxed">
            By recording this return, you confirm that the item has been physically handed over to the owner.
            The item status will be permanently marked as <strong>Returned</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-line-500 uppercase tracking-wider block">
            Handover Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-line bg-surface text-ink focus:ring-2 focus:ring-cobalt-500 outline-none transition-all"
            placeholder="Any details about the meeting or condition of the item..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSuccess({ notes })}
            disabled={isPending}
          >
            {isPending ? 'Recording...' : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Handover
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecordReturnDialog;
