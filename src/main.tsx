import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import WorkoutScreen from './screens/WorkoutScreen'
import MetricsScreen from './screens/MetricsScreen'
import CalendarScreen from './screens/CalendarScreen'
import SettingsScreen from './screens/SettingsScreen'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <WorkoutScreen /> },
      { path: 'metrics', element: <MetricsScreen /> },
      { path: 'calendar', element: <CalendarScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
