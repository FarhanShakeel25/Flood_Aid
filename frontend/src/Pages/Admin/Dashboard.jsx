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
                {stats.map((stat, index) => (
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
                                backgroundColor: 'rgba(241, 245, 249, 1)', // slate-100
                                color: '#334155'
                            }}>
                                <stat.icon size={24} />
                            </div>
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: stat.change.startsWith('+') ? '#16a34a' : '#ef4444',
                                background: stat.change.startsWith('+') ? '#dcfce7' : '#fee2e2',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px'
                            }}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>{stat.title}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

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
