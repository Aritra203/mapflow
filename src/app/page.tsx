'use client';

import dynamic from 'next/dynamic';
import { ConfigProvider } from 'antd';

// Dynamic import to avoid SSR issues with Leaflet
const Dashboard = dynamic(
  () => import('@/components/Dashboard').then(mod => ({ default: mod.Dashboard })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading Dashboard...</div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <main className="h-screen overflow-hidden">
        <Dashboard />
      </main>
    </ConfigProvider>
  );
}
