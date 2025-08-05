'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { useDashboardStore } from '@/store/dashboardStore';

const { Text, Title } = Typography;

export const ColorLegend: React.FC = () => {
  const { polygons, dataSources, selectedPolygonId } = useDashboardStore();

  const selectedPolygon = selectedPolygonId 
    ? polygons.find(p => p.id === selectedPolygonId)
    : null;

  const currentDataSource = selectedPolygon 
    ? dataSources.find(ds => ds.id === selectedPolygon.dataSourceId)
    : dataSources[0]; // Show first data source if no polygon selected

  if (!currentDataSource || currentDataSource.colorRules.length === 0) {
    return null;
  }

  const getOperatorText = (operator: string) => {
    switch (operator) {
      case '>': return '>';
      case '<': return '<';
      case '>=': return '≥';
      case '<=': return '≤';
      case '=': return '=';
      default: return operator;
    }
  };

  const getUnitText = (field: string) => {
    switch (field) {
      case 'temperature_2m': return '°C';
      case 'relative_humidity_2m': return '%';
      case 'precipitation': return 'mm';
      case 'wind_speed_10m': return 'm/s';
      case 'wind_direction_10m': return '°';
      case 'surface_pressure': return 'hPa';
      default: return '';
    }
  };

  return (
    <Card
      size="small"
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] max-w-sm"
      title={
        <div className="text-center">
          <Title level={5} className="mb-1">Color Legend</Title>
          <Text type="secondary">{currentDataSource.name}</Text>
        </div>
      }
    >
      <div className="space-y-2">
        {currentDataSource.colorRules
          .sort((a, b) => a.value - b.value)
          .map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: rule.color }}
                />
                <Text className="text-sm">
                  {getOperatorText(rule.operator)} {rule.value}{getUnitText(currentDataSource.field)}
                </Text>
              </div>
            </div>
          ))}
        
        {/* Default color */}
        <div className="flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#94a3b8' }}
            />
            <Text className="text-sm" type="secondary">
              No rules match
            </Text>
          </div>
        </div>
      </div>
      
      {selectedPolygon && (
        <div className="mt-3 pt-2 border-t">
          <Text className="text-xs" type="secondary">
            Legend for: {selectedPolygon.name || 'Selected Polygon'}
          </Text>
        </div>
      )}
    </Card>
  );
};
