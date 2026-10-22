
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
  pending: '#FBBF24',   // Amber
  approved: '#0E8F7E',  // Teal (Found)
  rejected: '#C2273D',   // Danger
};

const ClaimsByStatusChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-line-50 rounded-2xl text-line-400 italic text-sm">
        No claims data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE1E8" />
          <XAxis
            dataKey="status"
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.status}`}
                fill={STATUS_COLORS[entry.status] || '#BDBDBD'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClaimsByStatusChart;
