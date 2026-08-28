import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AlertProvider } from './context/AlertContext'
import { initSyncManager } from './utils/syncManager'
import { dbService } from './services/DatabaseService'
import { syncService } from './services/SyncService'
import PullToRefresh from 'react-simple-pull-to-refresh'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Kasir from './pages/Kasir'
import KasirPOS from './pages/KasirPOS2'
import ManajemenMenu from './pages/ManajemenMenu'
import Laporan from './pages/Laporan'
import CRM from './pages/CRM'
import UserManage from './pages/UserManage'
import KDS from './pages/KDS'
import ManajemenPromo from './pages/ManajemenPromo'
import Monitoring from './pages/Monitoring'
import ImportData from './pages/ImportData'
import RoleManage from './pages/RoleManage'
import MenuPublik from './pages/MenuPublik'
import UpdateChecker from './components/UpdateChecker'

/**
 * ProtectedRoute now uses dynamic permissions from the roles table.
 * @param {string} module - The permission module key (e.g. 'dashboard', 'pos', 'kds')
 */
const ProtectedRoute = ({ children, module }) => {
  const { user, loading, canView } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  
  // If module is specified, check permissions
  if (module && !canView(module)) {
    // Redirect to a page they CAN access, or login
    // Find first accessible module
    const moduleRouteMap = {
      dashboard: '/kasir',
      pos: '/kasir/pos',
      manajemen_menu: '/kasir/menu',
      laporan: '/kasir/laporan',
      crm: '/kasir/crm',
      user_manage: '/kasir/user-manage',
      kds: '/kasir/kds',
      manajemen_promo: '/kasir/promo',
      logs_monitoring: '/kasir/monitoring',
      import: '/kasir/import',
      role: '/kasir/role'
    }
    
    for (const [mod, path] of Object.entries(moduleRouteMap)) {
      if (canView(mod)) return <Navigate to={path} replace />
    }
    return <Navigate to="/login" replace />
  }
  
  return children
}

const AuthRoute = ({ children }) => {
  const { user, loading, canView } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  )

  if (user) {
    // Redirect to the first module the user has access to
    if (canView('dashboard')) return <Navigate to="/kasir" replace />
    if (canView('pos')) return <Navigate to="/kasir/pos" replace />
    if (canView('manajemen_menu')) return <Navigate to="/kasir/menu" replace />
    if (canView('laporan')) return <Navigate to="/kasir/laporan" replace />
    if (canView('crm')) return <Navigate to="/kasir/crm" replace />
    if (canView('user_manage')) return <Navigate to="/kasir/user-manage" replace />
    if (canView('kds')) return <Navigate to="/kasir/kds" replace />
    if (canView('manajemen_promo')) return <Navigate to="/kasir/promo" replace />
    if (canView('logs_monitoring')) return <Navigate to="/kasir/monitoring" replace />
    if (canView('import')) return <Navigate to="/kasir/import" replace />
    if (canView('role')) return <Navigate to="/kasir/role" replace />
    // Fallback
    return <Navigate to="/kasir" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/kasir" element={<ProtectedRoute module="dashboard"><Kasir /></ProtectedRoute>} />
      <Route path="/kasir/pos" element={<ProtectedRoute module="pos"><KasirPOS /></ProtectedRoute>} />
      <Route path="/kasir/menu" element={<ProtectedRoute module="manajemen_menu"><ManajemenMenu /></ProtectedRoute>} />
      <Route path="/kasir/laporan" element={<ProtectedRoute module="laporan"><Laporan /></ProtectedRoute>} />
      <Route path="/kasir/crm" element={<ProtectedRoute module="crm"><CRM /></ProtectedRoute>} />
      <Route path="/kasir/user-manage" element={<ProtectedRoute module="user_manage"><UserManage /></ProtectedRoute>} />
      <Route path="/kasir/kds" element={<ProtectedRoute module="kds"><KDS /></ProtectedRoute>} />
      <Route path="/kasir/promo" element={<ProtectedRoute module="manajemen_promo"><ManajemenPromo /></ProtectedRoute>} />
      <Route path="/kasir/monitoring" element={<ProtectedRoute module="logs_monitoring"><Monitoring /></ProtectedRoute>} />
      <Route path="/kasir/import" element={<ProtectedRoute module="import"><ImportData /></ProtectedRoute>} />
      <Route path="/kasir/role" element={<ProtectedRoute module="role"><RoleManage /></ProtectedRoute>} />
      <Route path="/menu-publik" element={<MenuPublik />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

const AppWrapper = () => {
  const location = useLocation();
  // Nonaktifkan Pull-to-Refresh di dashboard dan halaman POS agar keranjang belanja
  // tidak terhapus ketika pengguna scroll ke atas (termasuk jika ada trailing slash)
  const isKasirPage = location.pathname === '/kasir' || 
                      location.pathname === '/kasir/' || 
                      location.pathname.startsWith('/kasir/pos');

  const content = (
    <div style={{ minHeight: '100%', height: '100%' }}>
      <AppRoutes />
    </div>
  );

  if (isKasirPage) {
    return content;
  }

  return (
    <PullToRefresh 
      onRefresh={async () => {
        if (navigator.onLine) {
          await syncService.syncOrders();
        }
        window.location.reload();
      }}
      pullingContent={<div className="text-center py-4 text-gray-500">Tarik untuk memuat ulang...</div>}
      refreshingContent={<div className="text-center py-4 text-gray-500">Memuat ulang...</div>}
    >
      {content}
    </PullToRefresh>
  );
};


export default function App() {
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    initSyncManager();
    
    // Minta izin Notifikasi (berlaku untuk Web dan Android 13+)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().catch(() => {});
    }

    // Capacitor Native Optimizations (Hanya berjalan jika di APK Android/iOS)
    if (Capacitor.isNativePlatform()) {
      // Pancing izin Bluetooth agar diminta di awal aplikasi
      if (window.bluetoothSerial) {
        window.bluetoothSerial.isEnabled(
          () => {}, 
          () => { window.bluetoothSerial.enable(() => {}, () => {}) }
        );
      }

      // 1. Mencegah layar tablet mati otomatis (sangat penting untuk kasir & dapur)
      KeepAwake.keepAwake().catch(() => {});
      
      // 2. Mengatur warna status bar HP agar menyatu dengan warna aplikasi New Chapter
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#F9F5F0' }).catch(() => {});

      // 3. Konfirmasi ke CapacitorUpdater bahwa aplikasi berhasil dimuat (mencegah auto-rollback OTA)
      CapacitorUpdater.notifyAppReady().catch(() => {});
    }

    // Inisialisasi Database SQLite & Layanan Sinkronisasi
    const initLocalDb = async () => {
      const isReady = await dbService.init();
      if (isReady) {
        await syncService.init();
      }
    };
    initLocalDb();

  }, []);

  return (
    <AuthProvider>
      <AlertProvider>
        <div className="flex flex-col h-[100dvh] overflow-hidden">
          <UpdateChecker />
          <OfflineBanner />
          <div className="flex-1 min-h-0 relative">
            <BrowserRouter>
              <AppWrapper />
            </BrowserRouter>
          </div>
        </div>
      </AlertProvider>
    </AuthProvider>
  )
}
