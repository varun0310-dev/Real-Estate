import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { month: 'Jan', customer: 320, newCustomer: 280 },
    { month: 'Feb', customer: 300, newCustomer: 370 },
    { month: 'Mar', customer: 260, newCustomer: 340 },
    { month: 'Apr', customer: 220, newCustomer: 290 },
    { month: 'May', customer: 230, newCustomer: 230 },
    { month: 'Jun', customer: 270, newCustomer: 250 },
    { month: 'Jul', customer: 310, newCustomer: 300 },
    { month: 'Aug', customer: 320, newCustomer: 330 },
    { month: 'Sept', customer: 290, newCustomer: 310 },
    { month: 'Oct', customer: 250, newCustomer: 280 },
    { month: 'Nov', customer: 190, newCustomer: 240 },
    { month: 'Dec', customer: 170, newCustomer: 220 },
];

// ✅ Tailwind version of custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 shadow-md">
                <p className="font-semibold mb-1">{label}</p>
                <p className="text-purple-600">● Customer: {payload[0].value}</p>
                <p className="text-green-600">● New Customers: {payload[1].value}</p>
            </div>
        );
    }

    return null;
};

const VisitorInsightsChart = () => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111] mb-5">Visitor Insights</h2>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0 0" />
                    <XAxis
                        dataKey="month"
                        axisLine={true}
                        tickLine={false}
                        stroke="#94a3b8"
                         tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        stroke="#94a3b8"
                         tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        iconSize={10}
                        iconType="circle"
                        formatter={(value) => (
                            <span className="text-slate-600 text-sm ml-1">
                                {value === 'customer' ? 'Customer' : 'New Customers'}
                            </span>
                        )}
                    />
                    <Line
                        type="monotone"
                        dataKey="customer"
                        stroke="#A020F0"
                        strokeWidth={3}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="newCustomer"
                        stroke="#00C853"
                        strokeWidth={3}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VisitorInsightsChart;
