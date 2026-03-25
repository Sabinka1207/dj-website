import { Navigate } from 'react-router-dom'
import { getToken } from '../utils/adminAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/admin/login" replace />
}
