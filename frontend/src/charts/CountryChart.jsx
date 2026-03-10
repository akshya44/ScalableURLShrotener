import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#a855f7'];

const CountryChart = ({ data = [] }) => {
    if (!data.length) return <p className="no-data">No country data yet</p>;

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="count"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="#0f172a"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(value, name) => [value, name]}
                />
                <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                    formatter={(value) => value || 'Unknown'}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CountryChart;
