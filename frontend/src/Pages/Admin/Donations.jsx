import React, { useState } from 'react';
import { Search, Eye, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TransactionReceipt from '../../components/Admin/TransactionReceipt';
import ExportFilterModal from '../../components/Admin/ExportFilterModal';
import '../../styles/AdminTables.css';

const AdminDonations = () => {
    const [donations] = useState([
        { id: '1001', donor: 'Alice Browser', amount: 'Rs. 50,000', date: '2023-12-20', status: 'Completed', method: 'Credit Card' },
        { id: '1002', donor: 'Bob Martin', amount: 'Rs. 1,20,000', date: '2023-12-19', status: 'Pending', method: 'Bank Transfer' },
        { id: '1003', donor: 'Charlie Davis', amount: 'Rs. 15,000', date: '2023-12-18', status: 'Completed', method: 'PayPal' },
        { id: '1004', donor: 'Diana Prince', amount: 'Rs. 5,00,000', date: '2023-12-18', status: 'Verified', method: 'Wire' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const handleViewReceipt = (donation) => {
        setSelectedTransaction(donation);
        setShowReceipt(true);
    };

    const filteredDonations = donations.filter(d => {
        const matchesSearch = d.donor.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = (criteria) => {
        const dataToExport = donations.filter(d => {
            const matchesStatus = criteria.status === 'all' || d.status.toLowerCase() === criteria.status;
            let matchesDate = true;
            if (criteria.dateRange.start) matchesDate = matchesDate && new Date(d.date) >= new Date(criteria.dateRange.start);
            if (criteria.dateRange.end) matchesDate = matchesDate && new Date(d.date) <= new Date(criteria.dateRange.end);
            return matchesStatus && matchesDate;
        });

        if (criteria.format === 'csv') {
            const headers = ['Transaction ID', 'Donor', 'Amount', 'Date', 'Method', 'Status'];
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(d => [d.id, `"${d.donor}"`, `"${d.amount}"`, d.date, d.method, d.status].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `donations_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } else if (criteria.format === 'pdf') {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('FloodAid Donation Report', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
            doc.text(`Filters: Status=${criteria.status}, Date=${criteria.dateRange.start || 'Start'} to ${criteria.dateRange.end || 'Now'}`, 14, 35);

            // Table
            autoTable(doc, {
                startY: 45,
                head: [['ID', 'Donor', 'Amount', 'Date', 'Method', 'Status']],
                body: dataToExport.map(d => [d.id, d.donor, d.amount, d.date, d.method, d.status]),
                headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // Blue header
                alternateRowStyles: { fillColor: [248, 250, 252] }, // Light alternate rows
                styles: { fontSize: 9, cellPadding: 3 },
            });

            doc.save(`donations_report_${new Date().toISOString().split('T')[0]}.pdf`);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>Donations Overview</h1>
                    <p>Track and manage incoming donations and transaction history.</p>
                </div>
                <button
                    className="action-btn"
                    onClick={() => setShowExportModal(true)}
                >
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            <div className="table-controls">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search by donor name or ID..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 0.5rem' }}></div>
                <div style={{ position: 'relative' }}>
                    <button
                        className="icon-btn"
                        title="Filter"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        style={{ background: statusFilter !== 'All' ? '#eff6ff' : '', borderColor: statusFilter !== 'All' ? '#3b82f6' : '' }}
                    >
                        <Filter size={20} color={statusFilter !== 'All' ? '#3b82f6' : 'currentColor'} />
                    </button>

                    {/* Status Filter Dropdown */}
                    {showFilterDropdown && (
                        <div className="animate-scale-in" style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            minWidth: '150px',
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FILTER BY STATUS</div>
                            {['All', 'Completed', 'Pending', 'Verified'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setShowFilterDropdown(false);
                                    }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.5rem 1rem',
                                        background: statusFilter === status ? '#f1f5f9' : 'white',
                                        color: statusFilter === status ? '#0f172a' : '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="table-container">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Donor</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDonations.map((d) => (
                                <tr key={d.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>#{d.id}</td>
                                    <td style={{ fontWeight: 500 }}>{d.donor}</td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.amount}</td>
                                    <td>{d.date}</td>
                                    <td>{d.method}</td>
                                    <td>
                                        <span className={`badge ${d.status === 'Completed' ? 'badge-green' :
                                            d.status === 'Pending' ? 'badge-orange' :
                                                d.status === 'Verified' ? 'badge-blue' : 'badge-gray'
                                            }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="icon-btn"
                                                title="View Details"
                                                onClick={() => handleViewReceipt(d)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Receipt Modal */}
            <TransactionReceipt
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                transaction={selectedTransaction}
            />

            {/* Export Filter Modal */}
            <ExportFilterModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />
        </div>
    );
};

export default AdminDonations;
