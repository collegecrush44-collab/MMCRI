import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Stethoscope, 
  CreditCard, 
  Activity, 
  TestTube, 
  Pill, 
  LogOut, 
  Menu, 
  X,
  Building2,
  Droplet,
  Ambulance
} from 'lucide-react';

import { 
  User, 
  HospitalName, 
  Patient, 
  Invoice, 
  Referral, 
  Ward, 
  BedStatus, 
  OTSchedule,
  UserRole
} from './types';

import { 
  MOCK_PATIENTS, 
  MOCK_WARDS, 
  MOCK_REFERRALS
} from './services/mockData';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import PatientsDB from './components/PatientsDB';
import Clinical from './components/Clinical';
import Billing from './components/Billing';
import Emergency from './components/Emergency';
import ICU from './components/ICU';
import DelloPlus from './components/DelloPlus';
import BloodBank from './components/BloodBank';
import Pharmacy from './components/Pharmacy';

// RBAC Configuration: Maps Roles to Allowed Module IDs
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ['dashboard', 'registration', 'emergency', 'icu', 'clinical', 'patients', 'billing', 'bloodbank', 'pharmacy', 'dello'],
  [UserRole.HOSPITAL_ADMIN]: ['dashboard', 'registration', 'emergency', 'icu', 'clinical', 'patients', 'billing', 'bloodbank', 'pharmacy', 'dello'],
  [UserRole.RECEPTIONIST]: ['registration', 'emergency', 'patients', 'billing', 'clinical'], // Clinical added for Lab Report viewing access
  [UserRole.STAFF_NURSE]: ['icu', 'clinical'], // Removed 'patients' access
  [UserRole.LAB_TECHNICIAN]: ['clinical'], // Restricted to Clinical (Lab Tab) only. No patient details/add access.
  [UserRole.CONSULTANT]: ['clinical', 'patients', 'icu', 'emergency', 'dello'],
  [UserRole.CASUALTY_MO]: ['emergency', 'clinical', 'patients', 'icu'],
  [UserRole.PHARMACIST]: ['pharmacy', 'billing'],
  [UserRole.ACCOUNTANT]: ['billing', 'patients'],
  [UserRole.BLOOD_BANK_MANAGER]: ['bloodbank'],
  [UserRole.DEPT_ADMIN]: ['clinical', 'patients', 'registration'],
  [UserRole.PATHOLOGIST]: ['clinical', 'patients'],
  [UserRole.RADIOLOGIST]: ['clinical', 'patients'],
};

// Extracted NavItem to prevent re-mounting on render which causes sidebar scroll reset
const NavItem = ({ 
  id, 
  icon: Icon, 
  label, 
  activeModule, 
  setActiveModule, 
  setMobileMenuOpen 
}: {
  id: string;
  icon: any;
  label: string;
  activeModule: string;
  setActiveModule: (id: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
}) => (
  <button
      onClick={() => { setActiveModule(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          activeModule === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
      }`}
  >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
  </button>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedHospital, setSelectedHospital] = useState<HospitalName | 'All'>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Data State
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [invoices, setInvoices] = useState<Invoice[]>([]); // Start empty or mock
  const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
  const [referrals, setReferrals] = useState<Referral[]>(MOCK_REFERRALS);
  const [otSchedule, setOtSchedule] = useState<OTSchedule[]>([]);

  // Handlers
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // RBAC: Hospital Locking Logic
      if (user.role === UserRole.SUPER_ADMIN) {
          setSelectedHospital('All');
      } else if (user.hospital) {
          setSelectedHospital(user.hospital);
      }

      // Automatically redirect to the first allowed module
      const allowedModules = ROLE_PERMISSIONS[user.role] || [];
      if (allowedModules.length > 0) {
          setActiveModule(allowedModules[0]);
      } else {
          // Fallback if role has no modules (shouldn't happen with correct config)
          setActiveModule('dashboard'); 
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveModule('dashboard');
  };

  const handleRegister = (newPatient: Patient) => {
      setPatients(prev => [newPatient, ...prev]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDeletePatient = (id: string) => {
      setPatients(prev => prev.filter(p => p.id !== id));
      // Also clear bed if occupied
      const wardWithPatient = wards.find(w => w.beds.some(b => b.patientId === id));
      if (wardWithPatient) {
          const bed = wardWithPatient.beds.find(b => b.patientId === id);
          if (bed) {
              updateBedStatus(wardWithPatient.id, bed.id, BedStatus.AVAILABLE);
          }
      }
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
      setInvoices(prev => [newInvoice, ...prev]);
  };
  
  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleAddReferral = (newReferral: Referral) => {
      setReferrals(prev => [newReferral, ...prev]);
  };
  
  const handleAcceptReferral = (id: string) => {
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: 'Admitted' } : r));
      setActiveModule('registration');
  };

  const handleAddOtSchedule = (newSchedule: OTSchedule) => {
      setOtSchedule(prev => [...prev, newSchedule]);
  };

  const updateBedStatus = (wardId: string, bedId: string, status: BedStatus, patientId?: string) => {
      setWards(prevWards => prevWards.map(ward => {
          if (ward.id === wardId) {
              return {
                  ...ward,
                  beds: ward.beds.map(bed => {
                      if (bed.id === bedId) {
                          return { ...bed, status, patientId: status === BedStatus.AVAILABLE ? undefined : patientId };
                      }
                      return bed;
                  })
              };
          }
          return ward;
      }));
  };

  const handleModuleNavigation = (id: string) => {
    setActiveModule(id);
    if (mainContentRef.current) {
        mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const checkPermission = (moduleId: string) => {
      if (!currentUser) return false;
      const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
      return allowed.includes(moduleId);
  };

  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed md:relative z-20 h-full w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner">M</div>
            <div>
                <h1 className="font-bold text-lg leading-tight">MMC & RI</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Integrated HMIS</p>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {checkPermission('dashboard') && <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('registration') && <NavItem id="registration" icon={UserPlus} label="Registration" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('emergency') && <NavItem id="emergency" icon={Ambulance} label="Casualty / Triage" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('icu') && <NavItem id="icu" icon={Activity} label="ICU Management" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            
            {/* Conditional Label for Clinical Module based on Role */}
            {checkPermission('clinical') && (
                <NavItem 
                    id="clinical" 
                    icon={currentUser?.role === UserRole.LAB_TECHNICIAN ? TestTube : Stethoscope} 
                    label={currentUser?.role === UserRole.LAB_TECHNICIAN ? "Laboratory" : currentUser?.role === UserRole.RECEPTIONIST ? "Lab Reports" : "Clinical & Wards"} 
                    activeModule={activeModule} 
                    setActiveModule={handleModuleNavigation} 
                    setMobileMenuOpen={setMobileMenuOpen} 
                />
            )}
            
            {checkPermission('patients') && <NavItem id="patients" icon={Users} label="Patient Records" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('billing') && <NavItem id="billing" icon={CreditCard} label="Billing & Insurance" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('bloodbank') && <NavItem id="bloodbank" icon={Droplet} label="Blood Bank" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('pharmacy') && <NavItem id="pharmacy" icon={Pill} label="Pharmacy" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
            {checkPermission('dello') && <NavItem id="dello" icon={Activity} label="Dello+ Referrals" activeModule={activeModule} setActiveModule={handleModuleNavigation} setMobileMenuOpen={setMobileMenuOpen} />}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center font-bold text-blue-200 border border-blue-700">
                    {currentUser?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{currentUser?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.role}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:text-white">
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500"><Menu className="w-6 h-6" /></button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Current Facility:</span>
                    <select 
                        value={selectedHospital} 
                        onChange={(e) => setSelectedHospital(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-transparent"
                        // Disable if user is NOT Super Admin
                        disabled={currentUser?.role !== UserRole.SUPER_ADMIN}
                    >
                        <option value="All">All Campuses (Integrated View)</option>
                        {Object.values(HospitalName).map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 </div>
            </div>
        </header>
        
        {/* Scrollable Area with Ref */}
        <div id="main-scroll-container" ref={mainContentRef} className="flex-1 overflow-y-auto p-8 no-scrollbar">
            {activeModule === 'dashboard' && <Dashboard selectedHospital={selectedHospital} />}
            {activeModule === 'registration' && (
                <Registration 
                    onRegister={handleRegister}
                    onAddInvoice={handleAddInvoice}
                    selectedHospital={selectedHospital} 
                    patients={patients}
                    wards={wards}
                    updateBedStatus={updateBedStatus}
                />
            )}
            {activeModule === 'patients' && (
                <PatientsDB 
                    patients={patients}
                    selectedHospital={selectedHospital}
                    onUpdatePatient={handleUpdatePatient}
                    onDeletePatient={handleDeletePatient}
                    onNavigate={setActiveModule}
                />
            )}
            {activeModule === 'emergency' && (
                <Emergency
                    patients={patients}
                    onRegister={handleRegister}
                    onAddInvoice={handleAddInvoice}
                    onUpdatePatient={handleUpdatePatient}
                    wards={wards}
                    updateBedStatus={updateBedStatus}
                    selectedHospital={selectedHospital}
                    onAddOtSchedule={handleAddOtSchedule}
                />
            )}
            {activeModule === 'icu' && (
                <ICU 
                    selectedHospital={selectedHospital}
                    patients={patients}
                    wards={wards}
                    updateBedStatus={updateBedStatus}
                />
            )}
            {(activeModule === 'clinical') && (
                <Clinical 
                    selectedHospital={selectedHospital} 
                    patients={patients}
                    currentUser={currentUser}
                    wards={wards}
                    updateBedStatus={updateBedStatus}
                    onUpdatePatient={handleUpdatePatient}
                    onAddInvoice={handleAddInvoice}
                    referrals={referrals}
                    onAddReferral={handleAddReferral}
                    otSchedule={otSchedule}
                    onAddOtSchedule={handleAddOtSchedule}
                    // Initial tab logic is handled inside Clinical based on Role
                />
            )}
            {activeModule === 'billing' && (
                <Billing 
                    invoices={invoices}
                    onAddInvoice={handleAddInvoice}
                    onUpdateInvoice={handleUpdateInvoice}
                    patients={patients}
                    wards={wards}
                    onUpdatePatient={handleUpdatePatient}
                    updateBedStatus={updateBedStatus}
                />
            )}
            {activeModule === 'bloodbank' && (
                <BloodBank 
                    selectedHospital={selectedHospital} 
                    patients={patients}
                />
            )}
            {activeModule === 'pharmacy' && (
                <Pharmacy 
                    patients={patients}
                    onAddInvoice={handleAddInvoice}
                />
            )}
            {activeModule === 'dello' && (
                <DelloPlus 
                    referrals={referrals}
                    onAcceptReferral={handleAcceptReferral}
                />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;