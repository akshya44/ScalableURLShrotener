import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BrowserChart = ({ data = [] }) => {
    if (!data.length) return <p className="no-data">No browser data yet</p>;

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="browser" tick={{ fill: '#94a3b8', fontSize: 12 }} width={70} />
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Clicks" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BrowserChart;
