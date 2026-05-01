import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppRoutes from './routes'
import { useAppearance } from './hooks/useAppearance'

const AppShell = () => {
  const { isAuthenticated } = useAuth()
  useAppearance(isAuthenticated)
  return <AppRoutes />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
