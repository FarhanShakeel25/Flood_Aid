import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { adminApi } from '../../services/adminApi';

function InventoryModal({ isOpen, onClose, item, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    quantity: '',
    unit: '',
    minStock: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'food',
        quantity: item.quantity || '',
        unit: item.unit || '',
        minStock: item.minStock || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'food',
        quantity: '',
        unit: '',
        minStock: ''
      });
    }
  }, [item]);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const saveItem = async () => {
      try {
        if (item) {
          await adminApi.updateInventoryItem(item.id, formData);
          alert('Item updated successfully!');
        } else {
          await adminApi.createInventoryItem(formData);
          alert('Item created successfully!');
        }
        onSuccess();
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to save item');
      } finally {
        setLoading(false);
      }
    };

    saveItem();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{item ?  'Edit Inventory Item' : 'Add New Item'}</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
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
            <label htmlFor="name">Item Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Rice Bags"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="food">Food</option>
              <option value="water">Water</option>
              <option value="medical">Medical</option>
              <option value="shelter">Shelter</option>
              <option value="clothing">Clothing</option>
              <option value="hygiene">Hygiene</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles. formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="500"
                min="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="unit">Unit</label>
              <input
                id="unit"
                name="unit"
                type="text"
                value={formData.unit}
                onChange={handleChange}
                placeholder="kg"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="minStock">Minimum Stock Level</label>
            <input
              id="minStock"
              name="minStock"
              type="number"
              value={formData.minStock}
              onChange={handleChange}
              placeholder="100"
              min="0"
              required
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' :  (item ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryModal;