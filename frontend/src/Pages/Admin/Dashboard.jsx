import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Activity,
    CheckCircle2,
    Clock3,
    XCircle,
    BarChart2
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminDashboard = () => {
    // Mock Data
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        fulfilled: 0,
        cancelled: 0,
        onHold: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                const res = await fetch('https://floodaid-api.onrender.com/api/helpRequest/stats');
                if (!res.ok) {
                    throw new Error('Failed to load request stats');
                }
                const data = await res.json();
                setStats({
                    total: data.total ?? 0,
                    pending: data.pending ?? 0,
                    inProgress: data.inProgress ?? 0,
                    fulfilled: data.fulfilled ?? 0,
                    cancelled: data.cancelled ?? 0,
                    onHold: data.onHold ?? 0
                });
                setStatsError('');
            } catch (err) {
                setStatsError(err.message || 'Failed to load stats');
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Requests', value: stats.total, icon: BarChart2, color: '#e0f2fe' },
        { title: 'Pending', value: stats.pending, icon: Clock3, color: '#fef9c3' },
        { title: 'In Progress', value: stats.inProgress, icon: Activity, color: '#ede9fe' },
        { title: 'Fulfilled', value: stats.fulfilled, icon: CheckCircle2, color: '#dcfce7' },
        { title: 'Cancelled', value: stats.cancelled, icon: XCircle, color: '#fee2e2' },
    ];

    const lineChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Donations (Rs.)',
                data: [12000, 19000, 3000, 5000, 2000, 24500],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: ['Food', 'Medical', 'Shelter', 'Rescue'],
        datasets: [
            {
                data: [35, 25, 20, 20],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: '#64748b' }}>Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
            }}>
                {statCards.map((stat, index) => (
                    <div key={index} style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                backgroundColor: stat.color,
                                color: '#0f172a'
                            }}>
                                <stat.icon size={24} />
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                {loadingStats ? 'Loading…' : ''}
                            </span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>{stat.title}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{loadingStats ? '—' : stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {statsError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.75rem' }}>
                    {statsError}
                </div>
            )}

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Line Chart */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>
                        Donation Trends
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Doughnut Chart */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>
                        Resource Allocation
                    </h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
