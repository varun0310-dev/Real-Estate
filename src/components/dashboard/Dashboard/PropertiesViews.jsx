import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { day: 'Monday', online: 14000, offline: 13000 },
    { day: 'Tuesday', online: 17000, offline: 12000 },
    { day: 'Wednesday', online: 6000, offline: 23000 },
    { day: 'Thursday', online: 15500, offline: 6500 },
    { day: 'Friday', online: 12000, offline: 11000 },
    { day: 'Saturday', online: 16500, offline: 14000 },
    { day: 'Sunday', online: 21000, offline: 11500 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-md shadow-md border border-gray-200">
                <p className="font-semibold text-[#0F1950]">{label}</p>
                <p className="text-sm text-blue-600">Online Sales: {payload[0].value}</p>
                <p className="text-sm text-green-600">Offline Sales: {payload[1].value}</p>
            </div>
        );
    }

    return null;
};

const PropertiesViews = () => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-md ">
            <h2 className="text-lg font-bold text-[#111111] mb-4">Property Views</h2>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} barCategoryGap="20%">
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="0" vertical={false} />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <XAxis
                        dataKey="day"
                        axisLine={true}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={10} 
                        formatter={(value) => (
                            <span style={{ color: '#000', fontSize: 12 }}>{value}</span>
                        )}
                    />


                    <Bar dataKey="online" barSize={12} name="Online Sales" fill="#0095FF" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="offline" barSize={12} name="Offline Sales" fill="#00E096" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PropertiesViews;
