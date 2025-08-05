'use client';

import React, { useEffect } from 'react';
import { Layout, message } from 'antd';
import { TimelineSlider } from './TimelineSlider';
import { MapComponent } from './MapComponent';
import { Sidebar } from './Sidebar';
import { useDashboardStore } from '@/store/dashboardStore';
import { WeatherService } from '@/services/weatherService';

const { Header, Content, Sider } = Layout;

export const Dashboard: React.FC = () => {
  const {
    polygons,
    timeline,
    dataSources,
    setWeatherData,
    updatePolygon,
    getPolygonCurrentValue,
  } = useDashboardStore();

  // Update polygon colors when timeline or data changes
  useEffect(() => {
    const updatePolygonColors = () => {
      polygons.forEach(polygon => {
        const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
        if (!dataSource) return;

        const currentValue = getPolygonCurrentValue(polygon.id);
        const newColor = WeatherService.getPolygonColor(currentValue, dataSource.colorRules);
        
        if (newColor !== polygon.color) {
          updatePolygon(polygon.id, { color: newColor });
        }
      });
    };

    updatePolygonColors();
  }, [
    timeline.selectedHour,
    timeline.selectedRange,
    timeline.mode,
    polygons,
    dataSources,
    getPolygonCurrentValue,
    updatePolygon,
  ]);

  // Fetch weather data for existing polygons when timeline base date changes
  useEffect(() => {
    const fetchWeatherDataForAllPolygons = async () => {
      if (polygons.length === 0) return;

      try {
        const { startDate, endDate } = WeatherService.getDateRange(timeline.baseDate);

        // Validate date range
        if (!WeatherService.isValidDateForAPI(startDate) || !WeatherService.isValidDateForAPI(endDate)) {
          message.warning('Selected date range is outside the available data range. Using default temperature values.');
          return;
        }

        const fetchPromises = polygons.map(async (polygon) => {
          const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
          if (!dataSource) return;

          try {
            const weatherData = await WeatherService.fetchWeatherData(
              polygon.id,
              polygon.centroid,
              startDate,
              endDate,
              dataSource.field
            );

            setWeatherData(polygon.id, weatherData);
          } catch (error) {
            console.error(`Failed to fetch weather data for polygon ${polygon.id}:`, error);
            // Set mock data as fallback
            const mockData = Array.from({ length: 30 * 24 }, (_, index) => ({
              polygonId: polygon.id,
              timestamp: new Date(startDate.getTime() + index * 60 * 60 * 1000).toISOString(),
              value: 15 + Math.sin(index / 24) * 10 + Math.random() * 5, // Mock temperature pattern
            }));
            setWeatherData(polygon.id, mockData);
          }
        });

        await Promise.all(fetchPromises);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        message.error('Failed to fetch weather data. Please try again.');
      }
    };

    fetchWeatherDataForAllPolygons();
  }, [timeline.baseDate, polygons, dataSources, setWeatherData]);

  return (
    <Layout className="h-screen">
      {/* Header with Timeline */}
      <Header className="bg-white border-b border-gray-200 h-auto p-4">
        <div className="max-w-full">
          <TimelineSlider />
        </div>
      </Header>

      <Layout className="flex-1">
        {/* Main Map Area */}
        <Content className="relative">
          <MapComponent />
        </Content>

        {/* Sidebar */}
        <Sider
          width={400}
          className="bg-white border-l border-gray-200"
          theme="light"
        >
          <Sidebar />
        </Sider>
      </Layout>
    </Layout>
  );
};
