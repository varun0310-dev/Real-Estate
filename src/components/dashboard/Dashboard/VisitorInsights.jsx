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

const defaultData = [
    { month: 'Jan', line1: 320, line2: 280 },
    { month: 'Feb', line1: 300, line2: 370 },
    { month: 'Mar', line1: 260, line2: 340 },
    { month: 'Apr', line1: 220, line2: 290 },
    { month: 'May', line1: 230, line2: 230 },
    { month: 'Jun', line1: 270, line2: 250 },
];

const CustomTooltip = ({ active, payload, label, line1Label, line2Label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-lg p-3 text-xs text-slate-800 shadow-lg">
                <p className="font-bold text-[#0D1C44] mb-1.5">{label}</p>
                {payload[0] && (
                    <p className="font-medium flex items-center gap-1.5" style={{ color: payload[0].stroke }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].stroke }} />
                        {line1Label || payload[0].name}: {payload[0].value}
                    </p>
                )}
                {payload[1] && (
                    <p className="font-medium flex items-center gap-1.5 mt-0.5" style={{ color: payload[1].stroke }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[1].stroke }} />
                        {line2Label || payload[1].name}: {payload[1].value}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const VisitorInsightsChart = ({
    title = 'Visitor Insights',
    subtitle,
    data = defaultData,
    xKey = 'month',
    line1Key = 'line1',
    line2Key = 'line2',
    line1Label = 'Customers',
    line2Label = 'New Customers',
    line1Color = '#8B5CF6',
    line2Color = '#10B981',
    height = 250,
}) => {
    const chartData = data && data.length > 0 ? data : defaultData;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-[#111827]">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="3 3" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    />
                    <Tooltip
                        content={
                            <CustomTooltip
                                line1Label={line1Label}
                                line2Label={line2Label}
                            />
                        }
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => (
                            <span className="text-gray-600 text-xs font-medium ml-1">{value}</span>
                        )}
                    />
                    <Line
                        type="monotone"
                        dataKey={line1Key}
                        name={line1Label}
                        stroke={line1Color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: line1Color }}
                        activeDot={{ r: 5 }}
                    />
                    {line2Key && (
                        <Line
                            type="monotone"
                            dataKey={line2Key}
                            name={line2Label}
                            stroke={line2Color}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: line2Color }}
                            activeDot={{ r: 5 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VisitorInsightsChart;
