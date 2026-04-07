import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import RoomManagement from './pages/admin/RoomManagement';
import BillingManagement from './pages/admin/BillingManagement';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/rooms" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><RoomManagement /></ProtectedRoute>
          } />
          <Route path="/admin/billing" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><BillingManagement /></ProtectedRoute>
          } />
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/lab" element={
            <ProtectedRoute allowedRoles={['LAB_TECH']}><LabDashboard /></ProtectedRoute>
          } />
          <Route path="/book-appointment" element={
            <ProtectedRoute allowedRoles={['PATIENT']}><BookAppointment /></ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div style={{ color:'white', padding:'40px', background:'#060b14', minHeight:'100vh' }}>
              <h1>403 - Access Denied</h1>
            </div>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
