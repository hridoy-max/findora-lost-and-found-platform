import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const ClaimReviewPanel = ({
  claim,
  onReview,
  isReviewing = false
}) => {
  const [reviewNote, setReviewNote] = useState(claim.review_note || '');

  if (!claim) return null;

  return (
    <div className="bg-surface border border-line rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-ink">Review Claim</h3>
        <Badge className={cn("px-3 py-1", claim.status === 'pending' ? "bg-cobalt-100 text-cobalt-700" : "bg-line-100 text-line-600")}>
          Status: {claim.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-line-500 uppercase tracking-wider block">
          Ownership Proof
        </label>
        <div className="p-4 bg-paper border border-line rounded-2xl text-ink leading-relaxed italic">
          "{claim.ownership_proof}"
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-line-500 uppercase tracking-wider block">
          Review Note (Optional)
        </label>
        <div className="relative">
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-line bg-surface text-ink focus:ring-2 focus:ring-cobalt-500 outline-none transition-all"
            placeholder="Explain why you are approving or rejecting this claim..."
          />
          <MessageSquare className="absolute bottom-3 right-3 w-4 h-4 text-line-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="text-danger border-danger hover:bg-danger-50"
          onClick={() => onReview({ status: 'rejected', review_note: reviewNote })}
          disabled={isReviewing || claim.status !== 'pending'}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button
          variant="primary"
          onClick={() => onReview({ status: 'approved', review_note: reviewNote })}
          disabled={isReviewing || claim.status !== 'pending'}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
      </div>
    </div>
  );
};

export default ClaimReviewPanel;
