import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CompaniesManager } from './components/companies/CompaniesManager';
import { FactorsManager } from './components/factors/FactorsManager';
import { PatientsManager } from './components/patients/PatientsManager';
import { PatientVisitsManager } from './components/patients/PatientVisitsManager';
import { DiagnosisPatients } from './components/patients/DiagnosisPatients';
import { ReportsManager } from './components/reports/ReportsManager';
import { CellPhoneManager } from './components/cellphone/CellPhoneManager';
import { DistributionManager } from './components/distribution/DistributionManager';
import { DeliveredManager } from './components/distribution/DeliveredManager';
import { RoleManager } from './components/roles/RoleManager';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AuthService } from './services/auth';
import { LoginRequest, RegisterRequest, User } from './types/api';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await AuthService.isAuthenticated();
        if (authenticated) {
          const currentUser = AuthService.getCurrentUser();
          if (currentUser) {
            // Ensure the user object has all required fields for Layout
            const userForLayout: User = {
              id: currentUser.id,
              username: currentUser.username || '',
              name: currentUser.name || currentUser.username || 'User',
              email: currentUser.email || currentUser.username || '',
              role: currentUser.role || 'User',
              state: currentUser.state || ''
            };
            setUser(userForLayout);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthService.clearAuth();
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      // Call login
      await AuthService.login(credentials);
      
      // Get the complete user from AuthService
      const currentUser = AuthService.getCurrentUser();
      console.log('Current user after login:', currentUser);
      
      if (currentUser) {
        // Ensure the user object has all required fields for Layout
        const userForLayout: User = {
          id: currentUser.id,
          username: currentUser.username || credentials.username,
          name: currentUser.name || currentUser.username || credentials.username,
          email: currentUser.email || currentUser.username || credentials.username,
          role: currentUser.role || 'User',
          state: currentUser.state || ''
        };
        
        setUser(userForLayout);
        setIsAuthenticated(true);
      } else {
        // Fallback if no user found
        const fallbackUser: User = {
          username: credentials.username,
          name: credentials.username,
          email: credentials.username,
          role: 'User',
          state: ''
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData: RegisterRequest) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      // Call register
      await AuthService.register(userData);
      
      // Get the complete user from AuthService
      const currentUser = AuthService.getCurrentUser();
      console.log('Current user after register:', currentUser);
      
      if (currentUser) {
        // Ensure the user object has all required fields for Layout
        const userForLayout: User = {
          id: currentUser.id,
          username: currentUser.username || userData.username,
          name: currentUser.name || currentUser.username || userData.username,
          email: currentUser.email || currentUser.username || userData.username,
          role: currentUser.role || userData.role,
          state: currentUser.state || userData.state
        };
        
        setUser(userForLayout);
        setIsAuthenticated(true);
      } else {
        // Fallback if no user found
        const fallbackUser: User = {
          username: userData.username,
          name: userData.username,
          email: userData.username,
          role: userData.role,
          state: userData.state
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', error);
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setActiveSection('dashboard');
  };

  const renderContent = () => {
    const section = activeSection.toLowerCase();

    switch (section) {
      case 'dashboard':
        return <Dashboard />;
      case 'patient':
      case 'patients':
      case 'patient-list':
        return <PatientsManager />;
      case 'patient-visits':
        return <PatientVisitsManager />;
      case 'diagnosis-patients':
        return <DiagnosisPatients />;
      case 'drugs':
      case 'drug-list':
      case 'factors':
        return <FactorsManager />;
      case 'companies':
        return <CompaniesManager />;
      case 'cellphone':
      case 'cellphone-treatment':
      case 'cell-phone':
      case 'cellphonetreatment':
        return <CellPhoneManager />;
      case 'distribution':
      case 'distribution-main':
      case 'distributed':
        return <DistributionManager />;
      case 'delivered':
        return <DeliveredManager />;
      case 'roles':
      case 'roles-screens':
        return <RoleManager />;
      case 'reports':
        return <ReportsManager />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</p>
              <p className="text-gray-600">The page for "{activeSection}" is not yet implemented.</p>
            </div>
          </div>
        );
    }
  };

  // Show loading spinner while checking auth
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Show login/register forms if not authenticated
  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setAuthError(null);
        }}
        loading={authLoading}
        error={authError}
      />
    ) : (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setShowRegister(true);
          setAuthError(null);
        }}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Show main app with Layout if authenticated
  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;