import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/authStore'
import Layout from './components/shared/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PatientsPage from './pages/PatientsPage'
import PatientDetail from './pages/PatientDetail'
import PrescriptionList from './pages/doctor/PrescriptionList'
import NewPrescription from './pages/doctor/NewPrescription'
import PrescriptionView from './pages/doctor/PrescriptionView'
import SalesPage from './pages/pharmacy/SalesPage'
import NewSale from './pages/pharmacy/NewSale'
import InventoryPage from './pages/pharmacy/InventoryPage'
import PurchasesPage from './pages/pharmacy/PurchasesPage'
import NewGRN from './pages/pharmacy/NewGRN'
import MedicinesPage from './pages/pharmacy/MedicinesPage'
import ReportsPage from './pages/reports/ReportsPage'
import UsersPage from './pages/admin/UsersPage'
import SettingsPage from './pages/admin/SettingsPage'

function Guard({ children, roles }) {
  const { isAuth, isRole } = useAuth()
  if (!isAuth) return <Navigate to="/login" replace />
  if (roles?.length && !isRole(...roles)) return <Navigate to="/" replace />
  return children
}
export default function App() {
  const { isAuth } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="prescriptions" element={<PrescriptionList />} />
        <Route path="prescriptions/new" element={<Guard roles={['doctor','admin']}><NewPrescription /></Guard>} />
        <Route path="prescriptions/:id" element={<PrescriptionView />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<Guard roles={['pharmacist','cashier','admin']}><NewSale /></Guard>} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/new" element={<Guard roles={['pharmacist','admin','manager']}><NewGRN /></Guard>} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="reports" element={<Guard roles={['admin','manager','pharmacist']}><ReportsPage /></Guard>} />
        <Route path="users" element={<Guard roles={['admin']}><UsersPage /></Guard>} />
        <Route path="settings" element={<Guard roles={['admin']}><SettingsPage /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
