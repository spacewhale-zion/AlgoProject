// src/components/ActivityHeatMap.jsx
import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { subDays, format } from 'date-fns';
import 'react-calendar-heatmap/dist/styles.css';

export default function ActivityHeatMap({ data }) {
  // data = [{ date: '2025-07-05', count: 3 }, ...]
  const today = new Date();
  const startDate = subDays(today, 180); // last 6 months

  return (
    <div>
      <h3 className="text-md font-medium mb-2">Submission Activity</h3>
      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={data}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          if (value.count >= 5) return 'color-scale-4';
          if (value.count >= 3) return 'color-scale-3';
          if (value.count >= 2) return 'color-scale-2';
          return 'color-scale-1';
        }}
        tooltipDataAttrs={(val) =>
          val.date ? { 'data-tip': `${val.date}: ${val.count} submissions` } : {}
        }
      />
    </div>
  );
}
