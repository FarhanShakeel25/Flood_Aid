import React, { useState } from 'react';

const UnassignModal = ({ requestId, isOpen, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 0, label: 'Personal Emergency' },
    { value: 1, label: 'Unable to Reach' },
    { value: 2, label: 'Need Backup' },
    { value: 3, label: 'Unable to Complete' },
    { value: 4, label: 'Other' },
  ];

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(requestId, parseInt(selectedReason));
      setSelectedReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to unassign request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">Unassign Request</h2>

        <p className="text-slate-300 text-sm mb-4">
          Request #{requestId}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-3">
            Reason for Unassigning
          </label>
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label key={reason.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="unassignReason"
                  value={reason.value}
                  checked={selectedReason === String(reason.value)}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-300">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-200 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedReason}
            className="px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-400 text-white transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Unassigning...' : 'Unassign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnassignModal;
