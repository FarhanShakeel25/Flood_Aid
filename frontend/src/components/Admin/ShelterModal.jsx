// frontend/src/components/Admin/ShelterModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { adminApi } from '../../services/adminApi';

const ShelterModal = ({ isOpen, onClose, shelter, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    location:  '',
    capacity: '',
    status: 'active',
    availableAid: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAid, setSelectedAid] = useState([]);

  const aidOptions = ['Food', 'Water', 'Medical', 'Shelter', 'Clothing', 'Hygiene'];

  useEffect(() => {
    if (shelter) {
      setFormData({
        name:  shelter.name || '',
        location: shelter.location || '',
        capacity: shelter.capacity || '',
        status: shelter.status || 'active',
        availableAid: shelter.availableAid || []
      });
      setSelectedAid(shelter.availableAid || []);
    } else {
      setFormData({
        name: '',
        location: '',
        capacity: '',
        status: 'active',
        availableAid: []
      });
      setSelectedAid([]);
    }
  }, [shelter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = { ...formData, availableAid: selectedAid };

    try {
      if (shelter) {
        await adminApi.updateShelter(shelter.id, submitData);
        alert('Shelter updated successfully! ');
      } else {
        await adminApi.createShelter(submitData);
        alert('Shelter created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save shelter');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ... prev, [name]: value }));
  };

  const toggleAid = (aid) => {
    setSelectedAid(prev => 
      prev.includes(aid) 
        ? prev.filter(a => a !== aid)
        : [...prev, aid]
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{shelter ? 'Edit Shelter' :  'Add New Shelter'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles. modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Shelter Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Camp Alpha"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData. location}
              onChange={handleChange}
              placeholder="City, Province"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="capacity">Capacity *</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                value={formData. capacity}
                onChange={handleChange}
                placeholder="500"
                min="1"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="full">Full</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Available Aid *</label>
            <div className={styles.checkboxGrid}>
              {aidOptions. map(aid => (
                <label key={aid} className={styles. checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedAid.includes(aid)}
                    onChange={() => toggleAid(aid)}
                  />
                  <span>{aid}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles. btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : (shelter ? 'Update Shelter' : 'Create Shelter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShelterModal;