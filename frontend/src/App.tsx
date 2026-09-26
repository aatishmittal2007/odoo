import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { RecordCountModal } from './components/operations/RecordCountModal';

import { ControlTower } from './pages/ControlTower';
import { Exceptions } from './pages/Exceptions';
import { ExceptionDetail } from './pages/ExceptionDetail';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { StockOverview } from './pages/StockOverview';
import { Warehouses } from './pages/Warehouses';
import { Receipts } from './pages/Operations/Receipts';
import { Deliveries } from './pages/Operations/Deliveries';
import { Transfers } from './pages/Operations/Transfers';
import { Adjustments } from './pages/Operations/Adjustments';
import { PhysicalCounts } from './pages/Operations/PhysicalCounts';
import { ProcessHealth } from './pages/ProcessHealth';
import { StockLedger } from './pages/StockLedger';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';
import { Investigations } from './pages/Investigations';
import { Tasks } from './pages/Tasks';
import { RootCauses } from './pages/RootCauses';
import { Resolutions } from './pages/Resolutions';
import { ReorderingRules } from './pages/ReorderingRules';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [countModalPreselectedProduct, setCountModalPreselectedProduct] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync client router with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleOpenCountModal = (productId?: string) => {
    setCountModalPreselectedProduct(productId);
    setIsCountModalOpen(true);
  };

  const handleCountRecorded = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        Authenticating StockSense Platform...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Dynamic Route Resolver
  const renderCurrentPage = () => {
    // Exception detail: /exceptions/:id
    if (currentPath.startsWith('/exceptions/')) {
      const id = currentPath.split('/exceptions/')[1]?.split('?')[0];
      return <ExceptionDetail key={`${id}-${refreshKey}`} id={id} navigate={navigate} />;
    }

    // Product detail: /products/:id
    if (currentPath.startsWith('/products/')) {
      const id = currentPath.split('/products/')[1]?.split('?')[0];
      return (
        <ProductDetail
          key={`${id}-${refreshKey}`}
          id={id}
          navigate={navigate}
          onOpenCountModal={handleOpenCountModal}
        />
      );
    }

    switch (currentPath.split('?')[0]) {
      case '/':
        return (
          <ControlTower
            key={refreshKey}
            navigate={navigate}
            onOpenCountModal={() => handleOpenCountModal()}
          />
        );
      case '/exceptions':
        return <Exceptions key={refreshKey} navigate={navigate} />;
      case '/products':
        return <Products key={refreshKey} navigate={navigate} />;
      case '/stock':
        return <StockOverview key={refreshKey} navigate={navigate} />;
      case '/warehouses':
      case '/locations':
        return <Warehouses key={refreshKey} navigate={navigate} />;
      case '/receipts':
        return <Receipts key={refreshKey} />;
      case '/deliveries':
        return <Deliveries key={refreshKey} />;
      case '/transfers':
        return <Transfers key={refreshKey} />;
      case '/adjustments':
        return <Adjustments key={refreshKey} />;
      case '/physical-counts':
        return (
          <PhysicalCounts
            key={refreshKey}
            onOpenCountModal={() => handleOpenCountModal()}
            navigate={navigate}
          />
        );
      case '/process-health':
        return <ProcessHealth key={refreshKey} />;
      case '/ledger':
        return <StockLedger key={refreshKey} />;
      case '/investigations':
        return <Investigations key={refreshKey} navigate={navigate} />;
      case '/tasks':
        return <Tasks key={refreshKey} navigate={navigate} />;
      case '/root-causes':
        return <RootCauses key={refreshKey} navigate={navigate} />;
      case '/resolutions':
        return <Resolutions key={refreshKey} navigate={navigate} />;
      case '/reordering-rules':
        return <ReorderingRules key={refreshKey} navigate={navigate} />;
      case '/warehouse-settings':
        return <SettingsPage key={`wh-${refreshKey}`} initialTab="facilities" />;
      case '/users-roles':
        return <SettingsPage key={`users-${refreshKey}`} initialTab="users" />;
      case '/settings':
      case '/settings/warehouse':
      case '/settings/users':
        return <SettingsPage key={refreshKey} />;
      default:
        return (
          <ControlTower
            key={refreshKey}
            navigate={navigate}
            onOpenCountModal={() => handleOpenCountModal()}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar currentPath={currentPath} navigate={navigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenCountModal={() => handleOpenCountModal()}
          navigate={navigate}
          onRefreshData={() => setRefreshKey((k) => k + 1)}
        />

        <main className="flex-1 pb-16">{renderCurrentPage()}</main>
      </div>

      {/* Global Physical Count Modal */}
      <RecordCountModal
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        onCountRecorded={handleCountRecorded}
        preselectedProductId={countModalPreselectedProduct}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
