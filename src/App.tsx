import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CompaniesManager } from './components/companies/CompaniesManager';
import { FactorsManager } from './components/factors/FactorsManager';
import { PatientsManager } from './components/patients/PatientsManager';
import { TreatmentsManager } from './components/treatments/TreatmentsManager';
import { ReportsManager } from './components/reports/ReportsManager';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  // ADD THESE TWO LINES - This saves the active section
  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
      setActiveSection(savedSection);
    }
  }, []);

  // ADD THIS LINE - This remembers the section when it changes
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <PatientsManager />;
      case 'treatments':
        return <TreatmentsManager />;
      case 'factors':
        return <FactorsManager />;
      case 'companies':
        return <CompaniesManager />;
      case 'reports':
        return <ReportsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </Layout>
  );
}

export default App;