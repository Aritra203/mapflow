import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

export interface ColorRule {
  id: string;
  operator: '=' | '<' | '>' | '<=' | '>=';
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  field: string;
  colorRules: ColorRule[];
}

export interface Polygon {
  id: string;
  points: [number, number][];
  dataSourceId: string;
  color: string;
  name?: string;
  centroid: [number, number];
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface TimelineState {
  mode: 'single' | 'range';
  selectedHour: number; // Hours from start of timeline
  selectedRange: [number, number]; // [start, end] hours from start of timeline
  baseDate: Date; // Center date (today)
}

export interface WeatherData {
  polygonId: string;
  timestamp: string;
  value: number;
}

interface DashboardState {
  // Timeline state
  timeline: TimelineState;
  
  // Polygon state
  polygons: Polygon[];
  selectedPolygonId: string | null;
  drawingMode: boolean;
  
  // Data sources
  dataSources: DataSource[];
  
  // Weather data cache
  weatherData: Map<string, WeatherData[]>;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setTimelineMode: (mode: 'single' | 'range') => void;
  setSelectedHour: (hour: number) => void;
  setSelectedRange: (range: [number, number]) => void;
  
  addPolygon: (polygon: Omit<Polygon, 'id' | 'color'>) => void;
  removePolygon: (id: string) => void;
  updatePolygon: (id: string, updates: Partial<Polygon>) => void;
  setSelectedPolygonId: (id: string | null) => void;
  setDrawingMode: (enabled: boolean) => void;
  
  addDataSource: (dataSource: Omit<DataSource, 'id'>) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  
  setWeatherData: (polygonId: string, data: WeatherData[]) => void;
  getPolygonCurrentValue: (polygonId: string) => number | null;
  
  setLoading: (loading: boolean) => void;
}

const DEFAULT_DATA_SOURCES: Array<Omit<DataSource, 'id'> & { id: string }> = [
  {
    id: 'temperature',
    name: 'Temperature',
    field: 'temperature_2m',
    colorRules: [
      { id: '1', operator: '<', value: 10, color: '#1890ff' },
      { id: '2', operator: '>=', value: 10, color: '#52c41a' },
      { id: '3', operator: '>=', value: 25, color: '#fa8c16' },
      { id: '4', operator: '>=', value: 35, color: '#f5222d' },
    ]
  },
  {
    id: 'humidity',
    name: 'Relative Humidity',
    field: 'relative_humidity_2m',
    colorRules: [
      { id: '1', operator: '<', value: 30, color: '#ff4d4f' },
      { id: '2', operator: '>=', value: 30, color: '#fa8c16' },
      { id: '3', operator: '>=', value: 60, color: '#52c41a' },
      { id: '4', operator: '>=', value: 80, color: '#1890ff' },
    ]
  },
  {
    id: 'precipitation',
    name: 'Precipitation',
    field: 'precipitation',
    colorRules: [
      { id: '1', operator: '=', value: 0, color: '#f0f0f0' },
      { id: '2', operator: '>', value: 0, color: '#52c41a' },
      { id: '3', operator: '>=', value: 2, color: '#1890ff' },
      { id: '4', operator: '>=', value: 10, color: '#722ed1' },
    ]
  },
  {
    id: 'wind_speed',
    name: 'Wind Speed',
    field: 'wind_speed_10m',
    colorRules: [
      { id: '1', operator: '<', value: 5, color: '#52c41a' },
      { id: '2', operator: '>=', value: 5, color: '#fa8c16' },
      { id: '3', operator: '>=', value: 15, color: '#ff4d4f' },
      { id: '4', operator: '>=', value: 25, color: '#722ed1' },
    ]
  }
];

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        timeline: {
          mode: 'single',
          selectedHour: 360, // Middle of 30-day window (15 days * 24 hours)
          selectedRange: [350, 370],
          baseDate: new Date(),
        },
        
        polygons: [],
        selectedPolygonId: null,
        drawingMode: false,
        
        dataSources: DEFAULT_DATA_SOURCES,
        
        weatherData: new Map(),
        isLoading: false,
    
    // Timeline actions
    setTimelineMode: (mode) => set((state) => ({
      timeline: { ...state.timeline, mode }
    })),
    
    setSelectedHour: (hour) => set((state) => ({
      timeline: { ...state.timeline, selectedHour: hour }
    })),
    
    setSelectedRange: (range) => set((state) => ({
      timeline: { ...state.timeline, selectedRange: range }
    })),
    
    // Polygon actions
    addPolygon: (polygonData) => {
      const id = `polygon_${Date.now()}`;
      const defaultDataSource = get().dataSources[0];
      
      const polygon: Polygon = {
        id,
        color: '#1890ff',
        ...polygonData,
        dataSourceId: polygonData.dataSourceId || defaultDataSource.id,
      };
      
      set((state) => ({
        polygons: [...state.polygons, polygon]
      }));
    },
    
    removePolygon: (id) => set((state) => ({
      polygons: state.polygons.filter(p => p.id !== id),
      selectedPolygonId: state.selectedPolygonId === id ? null : state.selectedPolygonId
    })),
    
    updatePolygon: (id, updates) => set((state) => ({
      polygons: state.polygons.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    })),
    
    setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),
    setDrawingMode: (enabled) => set({ drawingMode: enabled }),
    
    // Data source actions
    addDataSource: (dataSourceData) => {
      const id = `datasource_${Date.now()}`;
      const dataSource: DataSource = { id, ...dataSourceData };
      
      set((state) => ({
        dataSources: [...state.dataSources, dataSource]
      }));
    },
    
    updateDataSource: (id, updates) => set((state) => ({
      dataSources: state.dataSources.map(ds => 
        ds.id === id ? { ...ds, ...updates } : ds
      )
    })),
    
    // Weather data actions
    setWeatherData: (polygonId, data) => set((state) => {
      const newWeatherData = new Map(state.weatherData);
      newWeatherData.set(polygonId, data);
      return { weatherData: newWeatherData };
    }),
    
    getPolygonCurrentValue: (polygonId) => {
      const state = get();
      const data = state.weatherData.get(polygonId);
      if (!data || data.length === 0) return null;
      
      if (state.timeline.mode === 'single') {
        const targetHour = state.timeline.selectedHour;
        const targetDate = new Date(state.timeline.baseDate);
        targetDate.setDate(targetDate.getDate() - 15); // Start from 15 days ago
        targetDate.setHours(targetHour % 24);
        targetDate.setDate(targetDate.getDate() + Math.floor(targetHour / 24));
        
        const targetTimestamp = targetDate.toISOString().split('T')[0] + 'T' + 
          targetDate.getHours().toString().padStart(2, '0') + ':00';
        
        const record = data.find(d => d.timestamp.startsWith(targetTimestamp));
        return record?.value ?? null;
      } else {
        // Range mode - calculate average
        const [startHour, endHour] = state.timeline.selectedRange;
        const relevantData = data.filter((d, index) => 
          index >= startHour && index <= endHour
        );
        
        if (relevantData.length === 0) return null;
        
        const sum = relevantData.reduce((acc, d) => acc + d.value, 0);
        return sum / relevantData.length;
      }
    },
    
    setLoading: (loading) => set({ isLoading: loading }),
  }),
  {
    name: 'dashboard-storage',
    partialize: (state) => ({
      polygons: state.polygons,
      dataSources: state.dataSources,
      timeline: state.timeline,
    }),
  }
)));
