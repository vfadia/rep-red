import { Outlet } from 'react-router-dom'
import ScreenLayout from './components/ScreenLayout'
import BottomTabBar from './components/BottomTabBar'

export default function App() {
  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: 'var(--color-surface-base)' }}>
      <ScreenLayout>
        <Outlet />
      </ScreenLayout>
      <BottomTabBar />
    </div>
  )
}
