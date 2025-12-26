import React, { useState } from 'react';
import { X, Calendar, Download, RefreshCw } from 'lucide-react';

const ExportFilterModal = ({ isOpen, onClose, onExport }) => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [status, setStatus] = useState('all');
    const [format, setFormat] = useState('pdf');
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = () => {
        setIsExporting(true);
        // Simulate export process
        setTimeout(() => {
            setIsExporting(false);
            onExport({ dateRange, status, format });
            onClose();
        }, 1500);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                className="animate-scale-in"
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    width: '90%',
                    maxWidth: '450px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Export Report</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            color: '#64748b'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Date Range */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.75rem' }}>
                        Date Range
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>From</span>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>To</span>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Filter */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.75rem' }}>
                        Include Status
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['all', 'completed', 'pending', 'verified'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    border: `1px solid ${status === s ? '#3b82f6' : '#e2e8f0'}`,
                                    background: status === s ? '#eff6ff' : 'white',
                                    color: status === s ? '#2563eb' : '#64748b',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Format */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.75rem' }}>
                        Export Format
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div
                            onClick={() => setFormat('pdf')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: `2px solid ${format === 'pdf' ? '#3b82f6' : '#e2e8f0'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: format === 'pdf' ? '#eff6ff' : 'white'
                            }}
                        >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>PDF Document</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Best for printing</span>
                        </div>
                        <div
                            onClick={() => setFormat('csv')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: `2px solid ${format === 'csv' ? '#3b82f6' : '#e2e8f0'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: format === 'csv' ? '#eff6ff' : 'white'
                            }}
                        >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>CSV / Excel</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Best for analysis</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: isExporting ? 0.8 : 1
                    }}
                >
                    {isExporting ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Generating Report...
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            Export Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ExportFilterModal;
