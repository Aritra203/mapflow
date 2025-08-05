'use client';

import React from 'react';
import { Range, getTrackBackground } from 'react-range';
import { Button, Card, Typography, Tooltip } from 'antd';
import { format, addDays, addHours } from 'date-fns';
import { useDashboardStore } from '@/store/dashboardStore';

const { Title, Text } = Typography;

interface TimelineSliderProps {
  className?: string;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ className }) => {
  const {
    timeline,
    setTimelineMode,
    setSelectedHour,
    setSelectedRange,
  } = useDashboardStore();

  const totalHours = 30 * 24; // 30 days * 24 hours
  const minHour = 0;
  const maxHour = totalHours - 1;

  // Calculate dates for display
  const getDateFromHour = (hour: number): Date => {
    const baseDate = new Date(timeline.baseDate);
    const startDate = addDays(baseDate, -15); // Start 15 days ago
    return addHours(startDate, hour);
  };

  const formatHourDisplay = (hour: number): string => {
    const date = getDateFromHour(hour);
    return format(date, 'MMM dd, HH:mm');
  };

  const renderThumb = ({ props, index }: { props: React.HTMLProps<HTMLDivElement>; index: number }) => (
    <div
      {...props}
      key={index}
      className="h-6 w-6 bg-blue-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      <div className="w-2 h-2 bg-white rounded-full" />
    </div>
  );

  const renderTrack = ({ props, children }: { props: React.HTMLProps<HTMLDivElement>; children: React.ReactNode }) => (
    <div
      {...props}
      className="w-full h-2 rounded-full"
      style={{
        background: getTrackBackground({
          values: timeline.mode === 'single' 
            ? [timeline.selectedHour] 
            : timeline.selectedRange,
          colors: timeline.mode === 'single'
            ? ['#e2e8f0', '#3b82f6', '#e2e8f0']
            : ['#e2e8f0', '#3b82f6', '#e2e8f0'],
          min: minHour,
          max: maxHour,
        }),
      }}
    >
      {children}
    </div>
  );

  const renderMark = (hour: number) => {
    const date = getDateFromHour(hour);
    const isStartOfDay = date.getHours() === 0;
    
    if (!isStartOfDay) return null;
    
    return (
      <div
        key={hour}
        className="absolute top-4 transform -translate-x-1/2"
        style={{ left: `${(hour / maxHour) * 100}%` }}
      >
        <div className="w-px h-4 bg-gray-300" />
        <Text className="text-xs text-gray-500 mt-1 block">
          {format(date, 'MMM dd')}
        </Text>
      </div>
    );
  };

  return (
    <Card className={`${className} shadow-sm`}>
      <div className="space-y-4">
        {/* Header with mode toggle */}
        <div className="flex items-center justify-between">
          <Title level={4} className="m-0">
            Timeline Control
          </Title>
          <div className="flex gap-2">
            <Button
              size="small"
              type={timeline.mode === 'single' ? 'primary' : 'default'}
              onClick={() => setTimelineMode('single')}
            >
              Single Point
            </Button>
            <Button
              size="small"
              type={timeline.mode === 'range' ? 'primary' : 'default'}
              onClick={() => setTimelineMode('range')}
            >
              Time Range
            </Button>
          </div>
        </div>

        {/* Current selection display */}
        <div className="bg-gray-50 p-3 rounded-lg">
          {timeline.mode === 'single' ? (
            <div>
              <Text strong>Selected Time: </Text>
              <Text>{formatHourDisplay(timeline.selectedHour)}</Text>
            </div>
          ) : (
            <div>
              <Text strong>Selected Range: </Text>
              <div className="space-y-1">
                <div>
                  <Text>From: {formatHourDisplay(timeline.selectedRange[0])}</Text>
                </div>
                <div>
                  <Text>To: {formatHourDisplay(timeline.selectedRange[1])}</Text>
                </div>
                <div>
                  <Text type="secondary">
                    Duration: {timeline.selectedRange[1] - timeline.selectedRange[0] + 1} hours
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="relative py-8">
          <Range
            values={timeline.mode === 'single' 
              ? [timeline.selectedHour] 
              : timeline.selectedRange
            }
            step={1}
            min={minHour}
            max={maxHour}
            onChange={(values) => {
              if (timeline.mode === 'single') {
                setSelectedHour(values[0]);
              } else {
                setSelectedRange([values[0], values[1]]);
              }
            }}
            renderTrack={renderTrack}
            renderThumb={renderThumb}
          />
          
          {/* Time marks */}
          <div className="relative mt-2">
            {Array.from({ length: 31 }, (_, i) => i * 24).map(renderMark)}
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="flex flex-wrap gap-2">
          <Tooltip title="Go to current time">
            <Button
              size="small"
              onClick={() => {
                const currentHour = 15 * 24; // Middle of timeline (today)
                if (timeline.mode === 'single') {
                  setSelectedHour(currentHour);
                } else {
                  setSelectedRange([currentHour - 12, currentHour + 12]);
                }
              }}
            >
              Now
            </Button>
          </Tooltip>
          
          {timeline.mode === 'range' && (
            <>
              <Tooltip title="Select last 24 hours">
                <Button
                  size="small"
                  onClick={() => {
                    const current = timeline.selectedRange[1];
                    setSelectedRange([Math.max(0, current - 23), current]);
                  }}
                >
                  Last 24h
                </Button>
              </Tooltip>
              
              <Tooltip title="Select last week">
                <Button
                  size="small"
                  onClick={() => {
                    const current = timeline.selectedRange[1];
                    setSelectedRange([Math.max(0, current - 167), current]); // 7 * 24 - 1
                  }}
                >
                  Last Week
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
