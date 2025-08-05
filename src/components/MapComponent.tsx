'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import { LatLng, Map as LeafletMap, Icon } from 'leaflet';
import { Button, message, Modal, Select, Typography, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useDashboardStore } from '@/store/dashboardStore';
import { WeatherService } from '@/services/weatherService';
import { ColorLegend } from './ColorLegend';

import 'leaflet/dist/leaflet.css';

const { Text } = Typography;
const { Option } = Select;

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  const iconDefault = Icon.Default.prototype as Icon.Default & { _getIconUrl?: () => string };
  delete iconDefault._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface PolygonDrawerProps {
  onPolygonComplete: (points: [number, number][]) => void;
  isDrawing: boolean;
  onDrawingStateChange: (isDrawing: boolean) => void;
}

const PolygonDrawer: React.FC<PolygonDrawerProps> = ({
  onPolygonComplete,
  isDrawing,
  onDrawingStateChange,
}) => {
  const [points, setPoints] = useState<LatLng[]>([]);

  useMapEvents({
    click: (e) => {
      if (!isDrawing) return;

      const newPoints = [...points, e.latlng];
      setPoints(newPoints);

      if (newPoints.length >= 3) {
        // Show completion hint
        message.info(`${newPoints.length} points added. Click "Complete Polygon" or continue adding points (max 12).`);
      }

      if (newPoints.length >= 12) {
        // Auto-complete at max points
        handleComplete(newPoints);
      }
    },
  });

  const handleComplete = (currentPoints: LatLng[] = points) => {
    if (currentPoints.length < 3) {
      message.error('A polygon must have at least 3 points.');
      return;
    }

    const polygonPoints: [number, number][] = currentPoints.map(p => [p.lat, p.lng]);
    onPolygonComplete(polygonPoints);
    setPoints([]);
    onDrawingStateChange(false);
    message.success('Polygon created successfully!');
  };

  const handleCancel = () => {
    setPoints([]);
    onDrawingStateChange(false);
    message.info('Polygon drawing cancelled.');
  };

  // Render current drawing polygon
  if (points.length > 0) {
    return (
      <>
        <Polygon
          positions={points.map(p => [p.lat, p.lng])}
          pathOptions={{
            color: '#ff4d4f',
            fillColor: '#ff4d4f',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5',
          }}
        />
        {isDrawing && (
          <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
            <div className="space-y-2">
              <Text strong>Drawing Polygon</Text>
              <div>
                <Text>Points: {points.length}/12</Text>
              </div>
              <div className="flex gap-2">
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleComplete()}
                  disabled={points.length < 3}
                >
                  Complete
                </Button>
                <Button
                  size="small"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

interface PolygonEditorProps {
  polygon: {
    id: string;
    points: [number, number][];
  };
  isEditing: boolean;
  onUpdatePoints: (polygonId: string, newPoints: [number, number][]) => void;
  onFinishEditing: () => void;
}

const PolygonEditor: React.FC<PolygonEditorProps> = ({
  polygon,
  isEditing,
  onUpdatePoints,
  onFinishEditing,
}) => {
  const [editingPoints, setEditingPoints] = useState<[number, number][]>(polygon.points);
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);

  useMapEvents({
    mousemove: (e) => {
      if (draggedVertexIndex !== null && isEditing) {
        const newPoints = [...editingPoints];
        newPoints[draggedVertexIndex] = [e.latlng.lat, e.latlng.lng];
        setEditingPoints(newPoints);
      }
    },
    mouseup: () => {
      if (draggedVertexIndex !== null) {
        onUpdatePoints(polygon.id, editingPoints);
        setDraggedVertexIndex(null);
      }
    },
  });

  const handleVertexMouseDown = (index: number) => {
    if (isEditing) {
      setDraggedVertexIndex(index);
    }
  };

  const handleFinishEditing = () => {
    onUpdatePoints(polygon.id, editingPoints);
    onFinishEditing();
    message.success('Polygon updated successfully!');
  };

  const handleCancelEditing = () => {
    setEditingPoints(polygon.points);
    onFinishEditing();
    message.info('Polygon editing cancelled.');
  };

  if (!isEditing) return null;

  return (
    <>
      {/* Render vertex markers for editing */}
      {editingPoints.map((point, index) => (
        <CircleMarker
          key={`vertex-${polygon.id}-${index}`}
          center={[point[0], point[1]]}
          radius={6}
          pathOptions={{
            color: '#722ed1',
            fillColor: '#722ed1',
            fillOpacity: 0.8,
            weight: 2,
          }}
          eventHandlers={{
            mousedown: () => handleVertexMouseDown(index),
          }}
        />
      ))}

      {/* Editing controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
        <div className="space-y-2">
          <Typography.Text strong>Editing Polygon</Typography.Text>
          <div>
            <Typography.Text>Drag vertices to reshape polygon</Typography.Text>
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              type="primary"
              onClick={handleFinishEditing}
            >
              Save Changes
            </Button>
            <Button
              size="small"
              onClick={handleCancelEditing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

interface MapControlsProps {
  onStartDrawing: () => void;
  isDrawing: boolean;
  isEditing: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({ onStartDrawing, isDrawing, isEditing }) => {
  const map = useMap();

  const handleResetView = () => {
    map.setView([52.52, 13.41], 13); // Zoom level 13 ≈ 2 sq km resolution
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2">
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onStartDrawing}
        disabled={isDrawing || isEditing}
        className="block w-full"
        title={isEditing ? "Finish editing to draw new polygon" : "Draw a new polygon"}
      >
        Draw Polygon
      </Button>
      <Button
        onClick={handleResetView}
        className="block w-full"
        disabled={isDrawing || isEditing}
        title="Reset map view to default location"
      >
        Reset View
      </Button>
    </div>
  );
};

interface DataSourceSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (dataSourceId: string) => void;
  dataSources: Array<{ id: string; name: string }>;
}

const DataSourceSelectorModal: React.FC<DataSourceSelectorModalProps> = ({
  open,
  onClose,
  onSelect,
  dataSources,
}) => {
  const [selectedDataSource, setSelectedDataSource] = useState<string>();

  const handleOk = () => {
    if (selectedDataSource) {
      onSelect(selectedDataSource);
      setSelectedDataSource(undefined);
      onClose();
    }
  };

  return (
    <Modal
      title="Select Data Source"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okButtonProps={{ disabled: !selectedDataSource }}
    >
      <div className="space-y-4">
        <Text>Choose a data source for this polygon:</Text>
        <Select
          style={{ width: '100%' }}
          placeholder="Select data source"
          value={selectedDataSource}
          onChange={setSelectedDataSource}
        >
          {dataSources.map(ds => (
            <Option key={ds.id} value={ds.id}>
              {ds.name}
            </Option>
          ))}
        </Select>
      </div>
    </Modal>
  );
};

export const MapComponent: React.FC = () => {
  const {
    polygons,
    drawingMode,
    setDrawingMode,
    addPolygon,
    removePolygon,
    setSelectedPolygonId,
    selectedPolygonId,
    dataSources,
    timeline,
    setWeatherData,
    getPolygonCurrentValue,
    updatePolygon,
  } = useDashboardStore();

  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [pendingPolygonPoints, setPendingPolygonPoints] = useState<[number, number][]>([]);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [renamingPolygonId, setRenamingPolygonId] = useState<string | null>(null);
  const [newPolygonName, setNewPolygonName] = useState<string>('');
  const mapRef = useRef<LeafletMap>(null);

  const handleStartDrawing = () => {
    setDrawingMode(true);
    message.info('Click on the map to start drawing a polygon. Minimum 3 points, maximum 12 points.');
  };

  const handlePolygonComplete = (points: [number, number][]) => {
    setPendingPolygonPoints(points);
    
    if (dataSources.length === 1) {
      // Auto-select the only data source
      createPolygon(points, dataSources[0].id);
    } else {
      // Show data source selection modal
      setShowDataSourceModal(true);
    }
  };

  const createPolygon = async (points: [number, number][], dataSourceId: string) => {
    try {
      const centroid = WeatherService.calculateCentroid(points);
      const boundingBox = WeatherService.calculateBoundingBox(points);

      addPolygon({
        points,
        dataSourceId,
        centroid,
        boundingBox,
        name: `Polygon ${polygons.length + 1}`,
      });

      // Fetch weather data for the new polygon
      await fetchWeatherDataForPolygon(
        `polygon_${Date.now()}`, // This should match the ID generated in addPolygon
        centroid,
        dataSourceId
      );
    } catch (error) {
      console.error('Error creating polygon:', error);
      message.error('Failed to create polygon. Please try again.');
    }
  };

  const fetchWeatherDataForPolygon = async (
    polygonId: string,
    centroid: [number, number],
    dataSourceId: string
  ) => {
    try {
      const dataSource = dataSources.find(ds => ds.id === dataSourceId);
      if (!dataSource) return;

      const { startDate, endDate } = WeatherService.getDateRange(timeline.baseDate);
      
      const weatherData = await WeatherService.fetchWeatherData(
        polygonId,
        centroid,
        startDate,
        endDate,
        dataSource.field
      );

      setWeatherData(polygonId, weatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      message.error('Failed to fetch weather data for polygon.');
    }
  };

  const handleDataSourceSelect = (dataSourceId: string) => {
    createPolygon(pendingPolygonPoints, dataSourceId);
    setPendingPolygonPoints([]);
  };

  const getPolygonColor = (polygonId: string): string => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return '#1890ff';

    const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
    if (!dataSource) return '#1890ff';

    const currentValue = getPolygonCurrentValue(polygonId);
    return WeatherService.getPolygonColor(currentValue, dataSource.colorRules);
  };

  const handlePolygonClick = (polygonId: string) => {
    setSelectedPolygonId(selectedPolygonId === polygonId ? null : polygonId);
  };

  const handleDeletePolygon = (polygonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Polygon',
      content: 'Are you sure you want to delete this polygon?',
      onOk: () => {
        removePolygon(polygonId);
        message.success('Polygon deleted successfully.');
      },
    });
  };

  const handleEditPolygon = (polygonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPolygonId(polygonId);
    message.info('Drag the purple vertices to reshape the polygon.');
  };

  const handleUpdatePolygonPoints = (polygonId: string, newPoints: [number, number][]) => {
    const centroid = WeatherService.calculateCentroid(newPoints);
    const boundingBox = WeatherService.calculateBoundingBox(newPoints);
    
    updatePolygon(polygonId, {
      points: newPoints,
      centroid,
      boundingBox,
    });
  };

  const handleFinishEditing = () => {
    setEditingPolygonId(null);
  };

  const handleStartRenaming = (polygonId: string, currentName: string) => {
    setRenamingPolygonId(polygonId);
    setNewPolygonName(currentName || '');
  };

  const handleFinishRenaming = () => {
    if (renamingPolygonId && newPolygonName.trim()) {
      updatePolygon(renamingPolygonId, { name: newPolygonName.trim() });
      message.success('Polygon renamed successfully!');
    }
    setRenamingPolygonId(null);
    setNewPolygonName('');
  };

  const handleCancelRenaming = () => {
    setRenamingPolygonId(null);
    setNewPolygonName('');
  };

  // Update polygon colors when timeline changes
  useEffect(() => {
    // The polygon colors will be updated automatically through the store getters
    // when timeline changes, so we just need to trigger a re-render
  }, [timeline.selectedHour, timeline.selectedRange, timeline.mode, polygons]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[52.52, 13.41]} // Berlin as default center
        zoom={13} // Zoom level 13 ≈ 2 sq km resolution
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render existing polygons */}
        {polygons.map((polygon) => {
          const isSelected = selectedPolygonId === polygon.id;
          const isEditing = editingPolygonId === polygon.id;
          
          return (
            <React.Fragment key={polygon.id}>
              <Polygon
                positions={polygon.points}
                pathOptions={{
                  color: isSelected ? '#722ed1' : isEditing ? '#722ed1' : getPolygonColor(polygon.id),
                  fillColor: getPolygonColor(polygon.id),
                  fillOpacity: isEditing ? 0.2 : 0.4,
                  weight: isSelected || isEditing ? 3 : 2,
                  dashArray: isEditing ? '5, 5' : undefined,
                }}
                eventHandlers={{
                  click: () => !isEditing && handlePolygonClick(polygon.id),
                }}
              />
              
              {/* Render polygon editor if this polygon is being edited */}
              {isEditing && (
                <PolygonEditor
                  polygon={polygon}
                  isEditing={isEditing}
                  onUpdatePoints={handleUpdatePolygonPoints}
                  onFinishEditing={handleFinishEditing}
                />
              )}
            </React.Fragment>
          );
        })}

        <PolygonDrawer
          onPolygonComplete={handlePolygonComplete}
          isDrawing={drawingMode}
          onDrawingStateChange={setDrawingMode}
        />

        <MapControls
          onStartDrawing={handleStartDrawing}
          isDrawing={drawingMode}
          isEditing={editingPolygonId !== null}
        />
      </MapContainer>

      {/* Color Legend */}
      <ColorLegend />

      {/* Selected polygon info */}
      {selectedPolygonId && !editingPolygonId && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
          {(() => {
            const polygon = polygons.find(p => p.id === selectedPolygonId);
            if (!polygon) return null;

            const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
            const currentValue = getPolygonCurrentValue(polygon.id);

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {renamingPolygonId === polygon.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={newPolygonName}
                        onChange={(e) => setNewPolygonName(e.target.value)}
                        onPressEnter={handleFinishRenaming}
                        onBlur={handleFinishRenaming}
                        autoFocus
                        size="small"
                        className="flex-1"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={handleFinishRenaming}
                        title="Save name"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={handleCancelRenaming}
                        title="Cancel"
                      />
                    </div>
                  ) : (
                    <Text 
                      strong 
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => handleStartRenaming(polygon.id, polygon.name || '')}
                      title="Click to rename"
                    >
                      {polygon.name || 'Unnamed Polygon'}
                    </Text>
                  )}
                  <div className="flex gap-1">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handleEditPolygon(polygon.id, e)}
                      disabled={editingPolygonId !== null || drawingMode}
                      title="Edit polygon vertices"
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDeletePolygon(polygon.id, e)}
                      disabled={editingPolygonId !== null || drawingMode}
                      title="Delete polygon"
                    />
                  </div>
                </div>
                <div>
                  <Text>Data Source: {dataSource?.name}</Text>
                </div>
                <div>
                  <Text>Current Value: </Text>
                  <Text strong>
                    {currentValue !== null ? `${currentValue.toFixed(1)}°C` : 'Loading...'}
                  </Text>
                </div>
                <div>
                  <Text>Points: {polygon.points.length}</Text>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <DataSourceSelectorModal
        open={showDataSourceModal}
        onClose={() => {
          setShowDataSourceModal(false);
          setPendingPolygonPoints([]);
        }}
        onSelect={handleDataSourceSelect}
        dataSources={dataSources}
      />
    </div>
  );
};
