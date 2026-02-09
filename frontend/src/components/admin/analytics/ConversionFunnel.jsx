import React from 'react';

const ConversionFunnel = ({ data }) => {
  const funnelStages = [
    { name: 'Enquiry', count: data.enquiry, color: 'bg-blue-500' },
    { name: 'Counselling', count: data.counselling, color: 'bg-indigo-500' },
    { name: 'Free Batch', count: data.freeBatch, color: 'bg-purple-500' },
    { name: 'Paid Batch', count: data.paidBatch, color: 'bg-pink-500' },
    { name: 'Admission', count: data.converted, color: 'bg-green-500' }
  ];

  const maxCount = Math.max(...funnelStages.map(s => s.count));

  return (
    <div className="space-y-3">
      {funnelStages.map((stage, index) => {
        const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const conversionRate = index > 0 && funnelStages[index - 1].count > 0
          ? ((stage.count / funnelStages[index - 1].count) * 100).toFixed(1)
          : 100;

        return (
          <div key={stage.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{stage.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {stage.count} ({conversionRate}%)
                </span>
              </div>
            </div>
            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`${stage.color} h-full transition-all duration-500 flex items-center justify-between px-4`}
                style={{ width: `${width}%` }}
              >
                <span className="text-white font-semibold text-sm">{stage.name}</span>
                <span className="text-white font-bold">{stage.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversionFunnel;
