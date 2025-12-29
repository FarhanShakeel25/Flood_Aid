import React, { useRef } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

const TransactionReceipt = ({ isOpen, onClose, transaction }) => {
    const receiptRef = useRef(null);

    if (!isOpen || !transaction) return null;

    const handleDownload = async () => {
        if (receiptRef.current) {
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `receipt-${transaction.id}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
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
                animation: 'fadeIn 0.2s ease-out',
                padding: '1rem' // Added padding to safe area on mobile
            }}
            onClick={onClose}
        >
            {/* Refined "Flag" Burst - Subtle Center Icon */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '2.5rem', /* Scaled down from 4rem */
                animation: 'burstUp 1.2s cubic-bezier(0.17, 0.89, 0.32, 1.1) forwards', /* Slower animation */
                pointerEvents: 'none',
                zIndex: 10000,
                '--drift-x': '-30%'
            }}>
                🎉
            </div>

            {/* Pro "Flag" Particle Burst */}
            {[...Array(25)].map((_, i) => {
                const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FF9A9E', '#A18CD1'];
                const angle = (i / 25) * 360;
                const velocity = 40 + Math.random() * 40; /* Reduced velocity for floatiness */
                const burstX = Math.cos(angle * Math.PI / 180) * velocity;
                const burstY = Math.sin(angle * Math.PI / 180) * velocity;
                const driftX = (Math.random() - 0.5) * 80;

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: '12px', /* Rectangular "flag" shape */
                            height: '6px',
                            background: colors[i % colors.length],
                            top: '50%',
                            left: '50%',
                            borderRadius: '1px',
                            animation: `floatFade ${1.5 + Math.random()}s cubic-bezier(0.2, 0.8, 0.4, 1) forwards`, /* Slower */
                            animationDelay: `${Math.random() * 0.2}s`,
                            opacity: 0,
                            '--burst-x': `${burstX}px`,
                            '--burst-y': `${burstY - 80}px`,
                            '--drift-x': `${driftX}px`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            pointerEvents: 'none',
                            zIndex: 10001
                        }}
                    />
                );
            })}

            <div
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    width: '100%',
                    maxWidth: '380px', // Slightly narrower for better proportion
                    maxHeight: '90vh', // Ensure it fits in viewport
                    overflowY: 'auto', // Scroll content if too tall
                    scrollbarWidth: 'none', // Hide scrollbar for cleaner look
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--admin-bg)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                    <X size={24} color="var(--admin-text-muted)" />
                </button>

                {/* Receipt Content Wrapper for Screenshot */}
                <div ref={receiptRef} style={{ padding: '0.5rem', background: 'var(--admin-card-bg)', borderRadius: '12px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🌊</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>FloodAid</h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>Donation Receipt</p>
                    </div>

                    {/* Success Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(22, 163, 74, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <CheckCircle size={18} color="#16a34a" />
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
                            Payment Successful
                        </span>
                    </div>

                    {/* Transaction Details */}
                    <div style={{
                        border: '2px dashed var(--admin-border)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)', fontFamily: 'monospace' }}>#{transaction.id}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Donor</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{transaction.donor}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Date</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{transaction.date}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Method</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{transaction.method}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Status</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>{transaction.status}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Amount Donated</p>
                        <p style={{ margin: 0, color: 'white', fontSize: '2.25rem', fontWeight: 700 }}>{transaction.amount}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--admin-text-secondary)' }}>
                            Thank you for your generous contribution!
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                            FloodAid © 2024
                        </p>
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'var(--admin-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'transform 0.2s',
                        flexShrink: 0
                    }}
                >
                    <Download size={18} />
                    Download Receipt
                </button>
            </div>
        </div>
    );
};

export default TransactionReceipt;
