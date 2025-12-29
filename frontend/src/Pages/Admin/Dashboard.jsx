import React from 'react';
import {
    Users,
    Heart,
    AlertTriangle,
    TrendingUp,
    Activity,
    DollarSign
} from 'lucide-react';
// import { Line, Doughnut } from 'react-chartjs-2'; // Assumed available or will stub
// Chart.js registration would be needed typically, simplifying for now with CSS/HTML charts or basic indicators
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
    const stats = [
        { title: 'Total Donations', value: 'Rs. 24,50,000', change: '+12%', icon: DollarSign, color: 'bg-blue-500' },
        { title: 'Active Volunteers', value: '1,234', change: '+5%', icon: Users, color: 'bg-purple-500' },
        { title: 'Relief Requests', value: '45', change: '-2%', icon: AlertTriangle, color: 'bg-orange-500' },
        { title: 'Cases Solved', value: '892', change: '+18%', icon: Activity, color: 'bg-green-500' },
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100%', color: 'var(--admin-text-main)' }}>
            <div style={{ marginBottom: '0rem' }}>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text-main)', margin: 0 }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '0.75rem' }}>Overview for today's activities.</p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem'
            }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{
                        background: 'var(--admin-card-bg)',
                        padding: '0.75rem', /* Slashed from 1rem */
                        borderRadius: '0.75rem',
                        border: '1px solid var(--admin-border)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{
                                padding: '0.375rem',
                                borderRadius: '0.375rem',
                                backgroundColor: 'var(--admin-bg)',
                                color: 'var(--admin-text-main)'
                            }}>
                                <stat.icon size={18} />
                            </div>
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: stat.change.startsWith('+') ? '#16a34a' : '#ef4444',
                                background: stat.change.startsWith('+') ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '9999px'
                            }}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', margin: 0 }}>{stat.title}</p>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text-main)', margin: 0 }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '0.75rem',
                flex: 1,
                minHeight: 0 // Allow grid contents to shrink
            }}>
                {/* Line Chart */}
                <div style={{
                    background: 'var(--admin-card-bg)',
                    padding: '1rem', /* Slashed from 1.25rem */
                    borderRadius: '0.75rem',
                    border: '1px solid var(--admin-border)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--admin-text-main)' }}>
                        Donation Trends
                    </h3>
                    <div style={{ flex: 1, minHeight: '180px' }}>
                        <Line
                            data={lineChartData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: 'var(--admin-text-secondary)', boxWidth: 10, font: { size: 10 } } }
                                },
                                scales: {
                                    x: { grid: { color: 'var(--admin-border)' }, ticks: { color: 'var(--admin-text-secondary)', font: { size: 10 } } },
                                    y: { grid: { color: 'var(--admin-border)' }, ticks: { color: 'var(--admin-text-secondary)', font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Doughnut Chart */}
                <div style={{
                    background: 'var(--admin-card-bg)',
                    padding: '1rem', /* Slashed from 1.25rem */
                    borderRadius: '0.75rem',
                    border: '1px solid var(--admin-border)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--admin-text-main)' }}>
                        Resource Allocation
                    </h3>
                    <div style={{ flex: 1, minHeight: '180px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut
                            data={doughnutData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: 'var(--admin-text-secondary)', boxWidth: 10, font: { size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
