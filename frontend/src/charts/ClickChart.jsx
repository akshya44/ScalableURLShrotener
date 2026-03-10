import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ClickChart = ({ data = [] }) => {
    if (!data.length) return <p className="no-data">No click data for this period</p>;

    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)} // show MM-DD
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#6366f1' }}
                />
                <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5, fill: '#818cf8' }}
                    name="Clicks"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ClickChart;
