import { WeatherData } from '@/store/dashboardStore';

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: Record<string, string>;
  hourly: Record<string, string[] | number[]>;
}

export class WeatherService {
  private static readonly BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';
  
  /**
   * Fetches weather data for a polygon's bounding box or centroid
   */
  static async fetchWeatherData(
    polygonId: string,
    centroid: [number, number],
    startDate: Date,
    endDate: Date,
    field: string = 'temperature_2m'
  ): Promise<WeatherData[]> {
    const [lat, lng] = centroid;
    
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      start_date: this.formatDate(startDate),
      end_date: this.formatDate(endDate),
      hourly: field,
      timezone: 'UTC'
    });
    
    try {
      const response = await fetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data: OpenMeteoResponse = await response.json();
      
      return this.transformWeatherData(polygonId, data, field);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw error;
    }
  }
  
  /**
   * Transforms Open-Meteo response to our internal format
   */
  private static transformWeatherData(
    polygonId: string,
    response: OpenMeteoResponse,
    field: string = 'temperature_2m'
  ): WeatherData[] {
    const { hourly } = response;
    const timeArray = hourly.time as string[];
    const valueArray = hourly[field] as number[];
    
    return timeArray.map((timestamp, index) => ({
      polygonId,
      timestamp,
      value: valueArray[index] || 0
    }));
  }
  
  /**
   * Formats a Date object to YYYY-MM-DD format required by Open-Meteo API
   */
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Gets the date range for a 30-day window (15 days before and after base date)
   */
  static getDateRange(baseDate: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - 15);
    
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 15);
    
    return { startDate, endDate };
  }
  
  /**
   * Calculates polygon centroid from points array
   */
  static calculateCentroid(points: [number, number][]): [number, number] {
    const sumLat = points.reduce((sum, [lat]) => sum + lat, 0);
    const sumLng = points.reduce((sum, [, lng]) => sum + lng, 0);
    
    return [sumLat / points.length, sumLng / points.length];
  }
  
  /**
   * Calculates bounding box from points array
   */
  static calculateBoundingBox(points: [number, number][]): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const lats = points.map(([lat]) => lat);
    const lngs = points.map(([, lng]) => lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }
  
  /**
   * Determines polygon color based on value and color rules
   */
  static getPolygonColor(
    value: number | null,
    colorRules: Array<{
      operator: '=' | '<' | '>' | '<=' | '>=';
      value: number;
      color: string;
    }>
  ): string {
    if (value === null) return '#gray-400';
    
    // Sort rules by value to ensure proper precedence
    const sortedRules = [...colorRules].sort((a, b) => a.value - b.value);
    
    for (const rule of sortedRules) {
      const { operator, value: ruleValue, color } = rule;
      
      switch (operator) {
        case '=':
          if (value === ruleValue) return color;
          break;
        case '<':
          if (value < ruleValue) return color;
          break;
        case '>':
          if (value > ruleValue) return color;
          break;
        case '<=':
          if (value <= ruleValue) return color;
          break;
        case '>=':
          if (value >= ruleValue) return color;
          break;
      }
    }
    
    // Default color if no rules match
    return '#94a3b8';
  }
  
  /**
   * Validates if a date is within reasonable bounds for the API
   */
  static isValidDateForAPI(date: Date): boolean {
    const now = new Date();
    const minDate = new Date('1940-01-01');
    const maxDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    
    return date >= minDate && date <= maxDate;
  }
}
