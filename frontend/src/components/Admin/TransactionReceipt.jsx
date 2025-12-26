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
            {/* Party Popper Animation - Top Icon */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '8rem',
                animation: 'partyPopper 0.6s ease-out',
                pointerEvents: 'none',
                zIndex: 10000
            }}>
                🎉
            </div>

            {/* Realistic Confetti Explosion from Bottom */}
            {[...Array(50)].map((_, i) => {
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#ff4757', '#ffa502', '#1e90ff', '#2ed573', '#ff6348'];
                const shapes = ['circle', 'square', 'rectangle'];
                const shape = shapes[i % 3];
                const randomX = (Math.random() - 0.5) * 150; // Spread horizontally
                const randomRotation = Math.random() * 720; // Random rotation
                const delay = Math.random() * 0.3; // Stagger the explosion

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: shape === 'rectangle' ? '15px' : '8px',
                            height: shape === 'rectangle' ? '6px' : '8px',
                            background: colors[i % colors.length],
                            bottom: '0%',
                            left: '50%',
                            borderRadius: shape === 'circle' ? '50%' : '2px',
                            animation: `confettiExplosion 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                            animationDelay: `${delay}s`,
                            opacity: 0,
                            transform: `translateX(${randomX}vw) rotate(${randomRotation}deg)`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                    onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                    <X size={24} color="#64748b" />
                </button>

                {/* Receipt Content Wrapper for Screenshot */}
                <div ref={receiptRef} style={{ padding: '0.5rem', background: 'white' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🌊</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>FloodAid</h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>Donation Receipt</p>
                    </div>

                    {/* Success Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: '#dcfce7',
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
                        border: '2px dashed #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>#{transaction.id}</p>
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
                    <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>
                            Thank you for your generous contribution!
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                            FloodAid © 2024
                        </p>
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    style={{
                        width: '100%',
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
                        flexShrink: 0 // Prevent button shrinking
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    <Download size={18} />
                    Download Receipt
                </button>
            </div>
        </div>
    );
};

export default TransactionReceipt;
