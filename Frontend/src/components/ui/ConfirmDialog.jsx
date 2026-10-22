import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'destructive' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-ink/80 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
};
