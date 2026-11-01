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

const defaultData = [
    { day: 'Mon', primary: 14000, secondary: 13000 },
    { day: 'Tue', primary: 17000, secondary: 12000 },
    { day: 'Wed', primary: 6000, secondary: 23000 },
    { day: 'Thu', primary: 15500, secondary: 6500 },
    { day: 'Fri', primary: 12000, secondary: 11000 },
    { day: 'Sat', primary: 16500, secondary: 14000 },
    { day: 'Sun', primary: 21000, secondary: 11500 },
];

const CustomTooltip = ({ active, payload, label, primaryLabel, secondaryLabel, formatValue }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
                <p className="font-bold text-[#0D1C44] mb-1.5">{label}</p>
                {payload[0] && (
                    <p className="text-blue-600 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0095FF]" />
                        {primaryLabel || payload[0].name}: {formatValue ? formatValue(payload[0].value) : payload[0].value}
                    </p>
                )}
                {payload[1] && (
                    <p className="text-emerald-600 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#00E096]" />
                        {secondaryLabel || payload[1].name}: {formatValue ? formatValue(payload[1].value) : payload[1].value}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const PropertiesViews = ({
    title = 'Property Views',
    subtitle,
    data = defaultData,
    xKey = 'day',
    primaryKey = 'primary',
    secondaryKey = 'secondary',
    primaryLabel = 'Online Views',
    secondaryLabel = 'Offline Views',
    primaryColor = '#0095FF',
    secondaryColor = '#00E096',
    formatValue = (v) => v?.toLocaleString?.() || v,
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
                <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <XAxis
                        dataKey={xKey}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                    />

                    <Tooltip
                        content={
                            <CustomTooltip
                                primaryLabel={primaryLabel}
                                secondaryLabel={secondaryLabel}
                                formatValue={formatValue}
                            />
                        }
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => (
                            <span className="text-gray-600 text-xs font-medium ml-1">{value}</span>
                        )}
                    />

                    <Bar
                        dataKey={primaryKey}
                        barSize={12}
                        name={primaryLabel}
                        fill={primaryColor}
                        radius={[3, 3, 0, 0]}
                    />
                    {secondaryKey && (
                        <Bar
                            dataKey={secondaryKey}
                            barSize={12}
                            name={secondaryLabel}
                            fill={secondaryColor}
                            radius={[3, 3, 0, 0]}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PropertiesViews;
