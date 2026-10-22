import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../../utils/cn';

const CHART_COLORS = ['#2F54EB', '#0E8F7E', '#C2570C', '#C2273D', '#DDE1E8', '#BDBDBD', '#6B7280'];

const ItemsByCategoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-line-50 rounded-2xl text-line-400 italic text-sm">
        No category data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE1E8" />
          <XAxis
            dataKey="category"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip
            cursor={{ fill: '#F7F8FA' }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #DDE1E8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ItemsByCategoryChart;
