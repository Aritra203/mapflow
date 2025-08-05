# Dashboard Interface with Dynamic Data Visualization

A comprehensive React/Next.js TypeScript dashboard that provides interactive mapping, timeline controls, and dynamic data visualization with polygon drawing capabilities and real-time weather data integration.

![Dashboard Preview](https://img.shields.io/badge/Status-Complete-green)
![Next.js](https://img.shields.io/badge/Next.js-15-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-18-blue)

## 🚀 Features

### Core Features
- **Interactive Timeline Slider**: Hourly resolution across a 30-day window (15 days before/after today)
  - Single point selection mode
  - Dual-ended range selection mode
  - Quick selection buttons (Now, Last 24h, Last Week)
  
- **Interactive Map with Polygon Drawing**:
  - Leaflet-based mapping with OpenStreetMap tiles
  - Draw polygons with 3-12 points
  - Click-to-draw interface with visual feedback
  - Polygon persistence and management
  - Map navigation and reset functionality
  
- **Dynamic Data Visualization**:
  - Real-time polygon coloring based on weather data
  - User-defined color rules with multiple operators (=, <, >, <=, >=)
  - Integration with Open-Meteo API for historical weather data
  - Automatic data updates when timeline changes
  
- **Advanced Sidebar Controls**:
  - Data source configuration
  - Color rule management
  - Polygon information display
  - Multiple data source support

### Bonus Features Implemented
- **Multiple Data Sources**: Support for temperature, humidity, precipitation, wind speed, etc.
- **Polygon Management**: View, select, and delete polygons
- **Polygon Editing**: Drag vertices to reshape existing polygons
- **Responsive Design**: Mobile-friendly interface
- **State Persistence**: Zustand-based state management
- **Error Handling**: Comprehensive error handling for API calls
- **Loading States**: User feedback during data fetching
- **Color Customization**: Full color picker integration

## 🛠 Tech Stack

### Required Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **State Management**: Zustand
- **Mapping**: Leaflet + React-Leaflet
- **UI Components**: Ant Design
- **Styling**: Tailwind CSS

### Additional Libraries
- **Timeline Slider**: react-range
- **Date Utilities**: date-fns
- **Icons**: Lucide React + Ant Design Icons
- **HTTP Requests**: Native fetch API

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assignment_website
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### Getting Started
1. **Draw Polygons**: Click "Draw Polygon" button and click on the map to create points (3-12 points)
2. **Timeline Control**: Use the timeline slider to select specific times or time ranges
3. **Data Visualization**: Watch polygons change color based on weather data and your color rules
4. **Configuration**: Use the sidebar to manage data sources and polygon settings

### Timeline Operations
- **Single Mode**: Select a specific hour to view point-in-time data
- **Range Mode**: Select a time window to view averaged data
- **Quick Actions**: Use preset buttons for common time selections

### Polygon Management
- **Drawing**: Minimum 3 points, maximum 12 points
- **Selection**: Click on polygons to view details
- **Deletion**: Use the delete button in polygon info panel
- **Data Source Assignment**: Assign different data sources to each polygon

### Data Source Configuration
- **Color Rules**: Define temperature thresholds with custom colors
- **Multiple Sources**: Add support for different weather parameters
- **Visual Feedback**: Real-time preview of color rules

## 🌐 API Integration

### Open-Meteo API
The application integrates with the Open-Meteo Archive API for historical weather data:

```
https://archive-api.open-meteo.com/v1/archive
```

**Supported Parameters**:
- `temperature_2m`: Temperature at 2 meters
- `relative_humidity_2m`: Relative humidity at 2 meters  
- `precipitation`: Precipitation amount
- `wind_speed_10m`: Wind speed at 10 meters
- `wind_direction_10m`: Wind direction at 10 meters
- `surface_pressure`: Surface pressure

**Data Range**: Historical data from 1940 to 5 days ago

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard container
│   ├── MapComponent.tsx   # Leaflet map with polygon drawing
│   ├── Sidebar.tsx        # Data source and polygon controls
│   └── TimelineSlider.tsx # Timeline control component
├── services/              # External service integrations
│   └── weatherService.ts  # Open-Meteo API integration
└── store/                 # State management
    └── dashboardStore.ts  # Zustand store definition
```

## 🔧 Configuration

### Environment Variables
No environment variables required for basic functionality. The application uses public APIs.

### Customization
- **Default Location**: Change in `MapComponent.tsx` (currently set to Berlin)
- **Date Range**: Modify in `weatherService.ts` (currently 30 days)
- **Color Themes**: Update in Ant Design theme configuration
- **Map Tiles**: Change TileLayer URL in `MapComponent.tsx`

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=out
```

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Development Notes

### State Management
The application uses Zustand for state management with the following key stores:
- **Timeline State**: Current time selection and mode
- **Polygon State**: Active polygons and drawing state
- **Data Sources**: Configuration and color rules
- **Weather Data**: Cached API responses

### Performance Considerations
- **Dynamic Imports**: Map components are dynamically imported to avoid SSR issues
- **Data Caching**: Weather data is cached in memory to reduce API calls
- **Debounced Updates**: Timeline changes are debounced to prevent excessive API requests

### Error Handling
- **API Failures**: Graceful fallback with mock data
- **Date Validation**: Ensures dates are within API limits
- **User Feedback**: Toast notifications for all user actions

## 🎨 Design Decisions

### Color Coding System
- Threshold-based rules with customizable operators
- Visual priority system for overlapping rules
- Default color schemes for common weather parameters

### User Experience
- Intuitive click-to-draw polygon interface
- Real-time feedback for all interactions
- Responsive design for mobile compatibility
- Accessible color choices and contrast ratios

## 📊 Technical Specifications

### Performance Metrics
- **Bundle Size**: Optimized with Next.js automatic code splitting
- **API Response Time**: Cached responses for improved performance
- **Rendering**: Efficient re-renders with React.memo and useMemo

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open-Meteo**: Weather data API
- **OpenStreetMap**: Map tile data
- **Ant Design**: UI component library
- **Leaflet**: Mapping library
- **Next.js Team**: React framework

---

**Built with ❤️ using React, Next.js, and TypeScript**
