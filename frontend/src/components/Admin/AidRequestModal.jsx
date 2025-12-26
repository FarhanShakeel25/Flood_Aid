// frontend/src/components/Admin/AidRequestModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { adminApi } from '../../services/adminApi';

const AidRequestModal = ({ isOpen, onClose, request, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setStatus(request.status || 'pending');
      setNotes('');
    }
  }, [request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminApi.updateAidRequestStatus(request.id, status, notes);
      alert('Aid request updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Aid Request</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.requestDetails}>
          <p><strong>Request ID:</strong> {request.id}</p>
          <p><strong>User:</strong> {request.userName}</p>
          <p><strong>Location:</strong> {request.location}</p>
          <p><strong>Type:</strong> {request.type}</p>
          <p><strong>Priority:</strong> <span className={styles[`priority${request.priority}`]}>{request.priority}</span></p>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="status">Update Status *</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className={styles. formGroup}>
            <label htmlFor="notes">Admin Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this update..."
              rows="4"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Updating...' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AidRequestModal;