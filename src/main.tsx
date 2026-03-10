import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { seedDatabase } from './db'

seedDatabase().catch(console.error)
import WorkoutScreen from './screens/WorkoutScreen'
import MetricsScreen from './screens/MetricsScreen'
import CalendarScreen from './screens/CalendarScreen'
import SettingsScreen from './screens/SettingsScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<WorkoutScreen />} />
          <Route path="metrics" element={<MetricsScreen />} />
          <Route path="calendar" element={<CalendarScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
