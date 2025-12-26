// frontend/src/components/Admin/UserModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { adminApi } from '../../services/adminApi';

const UserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'donor',
    phone: '',
    location: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user. role || 'donor',
        phone: user.phone || '',
        location: user.location || '',
        status: user.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'donor',
        phone: '',
        location: '',
        status:  'active'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // Update existing user
        await adminApi.updateUser(user.id, formData);
        alert('User updated successfully!');
      } else {
        // Create new user
        await adminApi.createUser(formData);
        alert('User created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className={styles. formGroup}>
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className={styles. formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="donor">Donor</option>
                <option value="victim">Victim</option>
                <option value="admin">Admin</option>
              </select>
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
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData. phone}
              onChange={handleChange}
              placeholder="+92-300-0000000"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Province"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' :  (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;