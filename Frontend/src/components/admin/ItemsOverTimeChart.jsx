
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ItemsOverTimeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-line-50 rounded-2xl text-line-400 italic text-sm">
        No timeline data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE1E8" />
          <XAxis
            dataKey="date"
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
            contentStyle={{ borderRadius: '12px', border: '1px solid #DDE1E8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#2F54EB"
            strokeWidth={3}
            dot={{ r: 4, fill: '#2F54EB' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ItemsOverTimeChart;
