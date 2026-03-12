import React from 'react';
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

import { AdminLogin } from './pages/AdminLogin';
import { AdminGuard } from './components/AdminGuard';
import { DashboardLayout } from './pages/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { PlantLibrary } from './pages/PlantLibrary';
import { AddPlant } from './pages/AddPlant';
import { EditPlant } from './pages/EditPlant';
import { Monitoring } from './pages/Monitoring';
import { GrowthDiary } from './pages/GrowthDiary';
import { GrowthDiaryDetail } from './pages/GrowthDiaryDetail';
import { OperationLogs } from './pages/OperationLogs';
import { PlantTimeline } from './pages/PlantTimeline';
import { AdoptedPlants } from './pages/AdoptedPlants';
import { StreamTest } from './pages/StreamTest';
import { NetworkDiagnostic } from './pages/NetworkDiagnostic';
import { VideoStatus } from './pages/VideoStatus';

function AdminRedirect() {
  return <Navigate to="/admin" replace />;
}

const router = createHashRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <Outlet />
        </ThemeProvider>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/login" replace /> },
      { path: 'admin/login', element: <AdminLogin /> },
      {
        path: 'admin',
        element: <AdminGuard />,
        children: [
          {
            path: '',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHome /> },
              {
                path: 'plants',
                children: [
                  { index: true, element: <PlantLibrary /> },
                  { path: 'add', element: <AddPlant /> },
                  { path: 'edit/:id', element: <EditPlant /> }
                ]
              },
              { path: 'adoptions', element: <AdoptedPlants /> },
              { path: 'monitoring', element: <Monitoring /> },
              {
                path: 'timeline',
                children: [
                  { index: true, element: <PlantTimeline /> },
                  { path: ':plantId', element: <PlantTimeline /> }
                ]
              },
              {
                path: 'diary',
                children: [
                  { index: true, element: <GrowthDiary /> },
                  { path: ':id', element: <GrowthDiaryDetail /> }
                ]
              },
              { path: 'logs', element: <OperationLogs /> },
              { path: 'stream-test', element: <StreamTest /> },
              { path: 'network-diagnostic', element: <NetworkDiagnostic /> },
              { path: 'video-status', element: <VideoStatus /> }
            ]
          },
          { path: '*', element: <AdminRedirect /> }
        ]
      },
      { path: '*', element: <Navigate to="/admin" replace /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
