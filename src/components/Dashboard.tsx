'use client';

import React, { useEffect, useState } from 'react';
import { Layout, message, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { TimelineSlider } from './TimelineSlider';
import { MapComponent } from './MapComponent';
import { Sidebar } from './Sidebar';
import { useDashboardStore } from '@/store/dashboardStore';
import { WeatherService } from '@/services/weatherService';

const { Header, Content, Sider } = Layout;

export const Dashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    polygons,
    timeline,
    dataSources,
    setWeatherData,
    updatePolygon,
    getPolygonCurrentValue,
  } = useDashboardStore();

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
      <Header className="bg-white border-b border-gray-200 h-auto p-2 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-2 md:mr-4">
            <TimelineSlider />
          </div>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex-shrink-0"
            />
          )}
        </div>
      </Header>

      <Layout className="flex-1">
        {/* Main Map Area */}
        <Content className="relative">
          <MapComponent />
        </Content>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sider
            width={400}
            className="bg-white border-l border-gray-200"
            theme="light"
          >
            <Sidebar />
          </Sider>
        )}

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <Drawer
            title="Controls"
            placement="right"
            onClose={() => setIsMobileMenuOpen(false)}
            open={isMobileMenuOpen}
            width="90%"
            styles={{
              body: { padding: 0 },
            }}
          >
            <Sidebar />
          </Drawer>
        )}
      </Layout>
    </Layout>
  );
};
