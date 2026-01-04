import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { X, Phone, Mail, MapPin, Clock, Tag } from 'lucide-react';

const RequestDetailModal = ({ request, onClose, onStatusUpdate }) => {
    const [mapKey, setMapKey] = useState(0);

    if (!request) return null;

    const handleStatusChange = (newStatus) => {
        // Parent already knows selected request; just pass the status
        onStatusUpdate(newStatus);
        onClose();
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                        Request #{request.id}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: '#64748b'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Request Type & Status */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Request Type</label>
                            <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: '0.5rem 0 0 0' }}>
                                {request.type}
                            </p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Status</label>
                            <select
                                value={request.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                <option value="Pending">Pending</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Fulfilled">Fulfilled</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b', fontWeight: 600 }}>
                            Contact Information
                        </h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Tag size={18} color="#64748b" />
                                <div>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Name</span>
                                    <p style={{ margin: 0, color: '#1e293b', fontWeight: 500 }}>{request.reportedBy}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Phone size={18} color="#64748b" />
                                <div>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Phone</span>
                                    <p style={{ margin: 0, color: '#1e293b', fontWeight: 500 }}>
                                        <a href={`tel:${request.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                            {request.phone}
                                        </a>
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={18} color="#64748b" />
                                <div>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Email</span>
                                    <p style={{ margin: 0, color: '#1e293b', fontWeight: 500 }}>
                                        <a href={`mailto:${request.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                            {request.email}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Description</label>
                        <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginTop: '0.5rem',
                            color: '#1e293b',
                            lineHeight: '1.6'
                        }}>
                            {request.description}
                        </div>
                    </div>

                    {/* Location */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Location</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginTop: '0.5rem'
                        }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Latitude</span>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b', fontWeight: 600 }}>
                                    {request.latitude.toFixed(6)}
                                </p>
                            </div>
                            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Longitude</span>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b', fontWeight: 600 }}>
                                    {request.longitude.toFixed(6)}
                                </p>
                            </div>
                        </div>

                        {/* Map */}
                        <div style={{
                            marginTop: '1rem',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            height: '300px'
                        }}>
                            <MapContainer
                                key={mapKey}
                                center={[request.latitude, request.longitude]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <Marker position={[request.latitude, request.longitude]}>
                                    <Popup>
                                        <div>
                                            <strong>{request.type}</strong>
                                            <p>({request.latitude.toFixed(4)}, {request.longitude.toFixed(4)})</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '1rem'
                    }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={14} /> Created
                            </label>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b', fontSize: '0.875rem' }}>
                                {formatDate(request.createdAt)}
                            </p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={14} /> Updated
                            </label>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#1e293b', fontSize: '0.875rem' }}>
                                {formatDate(request.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            color: '#1e293b',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailModal;
