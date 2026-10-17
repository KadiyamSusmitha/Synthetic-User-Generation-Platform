import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRoute() {
  const isLoggedIn =
    localStorage.getItem('synuserLoggedIn') === 'true'

  if (!isLoggedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute