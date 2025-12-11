import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, UserPlus, Activity, Droplet, Users, Menu, Building2, ChevronDown, LogOut, CreditCard, Siren, HeartPulse, Share2, Pill, X, Edit2, Save, RotateCcw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import Clinical from './components/Clinical';
import DelloPlus from './components/DelloPlus';
import Billing from './components/Billing';
import Emergency from './components/Emergency';
import ICU from './components/ICU';
import PatientsDB from './components/PatientsDB';
import Login from './components/Login';
import { HospitalName, Patient, User, UserRole, Invoice, Ward, BedStatus, Referral } from './types';
import { MOCK_PATIENTS, BLOOD_STOCK, MOCK_WARDS, MOCK_REFERRALS } from './services/mockData';

// Mock Initial Data for Invoices
const INITIAL_INVOICES: Invoice[] = [
    { id: 'INV-24-0982', patientName: 'Ramesh Kumar', uhid: 'MMC-KR-24-001', date: '2024-05-14', amount: 1550, status: 'Paid', mode: 'Cash', scheme: 'General', items: ['CBC', 'X-Ray Chest PA', 'Consultation'] },
    { id: 'INV-24-0983', patientName: 'Lakshmi Devi', uhid: 'MMC-KR-24-002', date: '2024-05-14', amount: 450, status: 'Pending', mode: '-', scheme: 'General', items: ['RBS', 'Consultation'] },
    { id: 'INV-24-0981', patientName: 'Syed Ahmed', uhid: 'MMC-TC-24-003', date: '2024-05-13', amount: 2500, status: 'Paid', mode: 'UPI', scheme: 'General', items: ['CT Scan Brain', 'Emergency Registration'] },
    { id: 'INV-24-0980', patientName: 'Priya Gowda', uhid: 'MMC-CH-24-105', date: '2024-05-13', amount: 0, status: 'Waived', mode: 'Ayushman Bharat', scheme: 'Ayushman Bharat', items: ['USG Abdomen'] },
];

// Simple Pharmacy Component with Edit Option
const Pharmacy: React.FC = () => {
    const [inventory, setInventory] = useState(() => {
        const saved = localStorage.getItem('pharmacy_inventory');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Paracetamol 650mg', batch: 'BAT-001', stock: 4500, expiry: 'Dec 2025', color: 'text-green-600' },
            { id: 2, name: 'Amoxicillin 500mg', batch: 'BAT-092', stock: 120, expiry: 'Aug 2024', color: 'text-amber-600' },
            { id: 3, name: 'Insulin Glargine', batch: 'INS-445', stock: 15, expiry: 'Sep 2024', color: 'text-red-600' },
            { id: 4, name: 'Atorvastatin 10mg', batch: 'BAT-105', stock: 800, expiry: 'Jan 2026', color: 'text-blue-600' },
            { id: 5, name: 'Pantoprazole 40mg', batch: 'BAT-202', stock: 1200, expiry: 'Mar 2025', color: 'text-green-600' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('pharmacy_inventory', JSON.stringify(inventory));
    }, [inventory]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    const handleEditClick = (item: any) => {
        setEditingId(item.id);
        setEditValue(item.stock);
    };

    const handleSave = (id: number) => {
        setInventory((prev: any[]) => prev.map(item => item.id === id ? { ...item, stock: editValue } : item));
        setEditingId(null);
    };

    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-slide-down">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Pill className="w-6 h-6 text-emerald-600" /> Hospital Pharmacy Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <h3 className="font-bold text-emerald-800 mb-2">Prescription Queue</h3>
                    <p className="text-sm text-emerald-700">12 Pending Orders</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">Inventory Status</h3>
                    <p className="text-sm text-blue-700">Stock Checked: Today 08:00 AM</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <h3 className="font-bold text-purple-800 mb-2">Daily Sales</h3>
                    <p className="text-sm text-purple-700">₹ 45,230</p>
                </div>
            </div>
            
            <div className="mt-8 border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 font-semibold text-slate-600">Medicine Name</th>
                            <th className="p-3 font-semibold text-slate-600">Batch No</th>
                            <th className="p-3 font-semibold text-slate-600">Stock</th>
                            <th className="p-3 font-semibold text-slate-600">Expiry</th>
                            <th className="p-3 font-semibold text-slate-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {inventory.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-700">{item.name}</td>
                                <td className="p-3 font-mono text-xs">{item.batch}</td>
                                <td className={`p-3 font-bold ${item.color}`}>
                                    {editingId === item.id ? (
                                        <input 
                                            type="number" 
                                            value={editValue} 
                                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        item.stock.toLocaleString()
                                    )}
                                </td>
                                <td className="p-3">{item.expiry}</td>
                                <td className="p-3 flex items-center gap-2">
                                    {editingId === item.id ? (
                                        <>
                                            <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save className="w-4 h-4"/></button>
                                            <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4"/></button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="text-blue-600 hover:underline">Dispense</button>
                                            <button onClick={() => handleEditClick(item)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded ml-2" title="Edit Stock">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Blood Bank simple component for the demo
const BloodBank: React.FC<{ selectedHospital: HospitalName | 'All' }> = ({ selectedHospital }) => {
    const [stock, setStock] = useState(() => {
        const saved = localStorage.getItem('blood_stock');
        return saved ? JSON.parse(saved) : BLOOD_STOCK;
    });

    useEffect(() => {
        localStorage.setItem('blood_stock', JSON.stringify(stock));
    }, [stock]);

    const [activeModal, setActiveModal] = useState<'requisition' | 'donor' | 'update' | null>(null);

    // Forms state
    const [reqForm, setReqForm] = useState({ patientName: '', bloodGroup: 'A+', units: 1, urgency: 'Routine' });
    const [donorForm, setDonorForm] = useState({ name: '', bloodGroup: 'O+', mobile: '', lastDonation: '', age: '', weight: '' });

    // Handle manual stock update
    const handleUpdateStock = (group: string, newUnits: number) => {
        setStock((prev: any[]) => prev.map(s => 
            s.group === group ? { 
                ...s, 
                units: newUnits, 
                status: newUnits < 10 ? 'Critical' : newUnits < 25 ? 'Low' : 'Normal' 
            } : s
        ));
    };

    // Handle Donor Registration
    const handleDonate = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulating: Add 1 unit for the donation
        const currentStock = stock.find((s: any) => s.group === donorForm.bloodGroup);
        if (currentStock) {
            handleUpdateStock(donorForm.bloodGroup, currentStock.units + 1);
        }
        alert(`Donor ${donorForm.name} registered successfully. 1 Unit of ${donorForm.bloodGroup} added to stock.`);
        setActiveModal(null);
        setDonorForm({ name: '', bloodGroup: 'O+', mobile: '', lastDonation: '', age: '', weight: '' });
    };

    // Handle Requisition Creation
    const handleRequisition = (e: React.FormEvent) => {
        e.preventDefault();
        const currentStock = stock.find((s: any) => s.group === reqForm.bloodGroup);
        
        if (currentStock && currentStock.units >= reqForm.units) {
            handleUpdateStock(reqForm.bloodGroup, currentStock.units - reqForm.units);
            alert(`Requisition approved. ${reqForm.units} units of ${reqForm.bloodGroup} allocated to ${reqForm.patientName}.`);
            setActiveModal(null);
        } else {
            alert(`Insufficient stock for ${reqForm.bloodGroup}. Current available: ${currentStock?.units || 0}. Requesting external transfer from Central Bank.`);
        }
        setReqForm({ patientName: '', bloodGroup: 'A+', units: 1, urgency: 'Routine' });
    };

    // Dynamic alerts based on hospital selection
    const getAlert = () => {
        if (selectedHospital === HospitalName.TRAUMA_CARE) {
            return {
                type: 'red',
                text: 'Critical Alert: O-Negative stock critically low for Emergency Trauma. Urgent requisition sent to Central Blood Bank.'
            };
        }
        if (selectedHospital === HospitalName.CHELUVAMBA) {
            return {
                type: 'yellow',
                text: 'Warning: High demand for A+ plasma units in Labor Ward. Ensure cross-matching buffer.'
            };
        }
        return {
            type: 'green',
            text: 'Stock levels nominal. Donor drive scheduled for Saturday at K R Hospital Campus.'
        };
    };

    const systemAlert = getAlert();

    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-slide-down relative">
            
            {/* Update Stock Modal Portal */}
            {activeModal === 'update' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-lg text-slate-800">Update Stock Levels</h3>
                            <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {stock.map((s: any) => (
                                <div key={s.group} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="font-bold text-slate-700 w-10 text-lg">{s.group}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleUpdateStock(s.group, Math.max(0, s.units - 1))} className="w-8 h-8 bg-white border border-slate-300 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold transition-all">-</button>
                                        <span className="w-10 text-center font-mono font-bold text-slate-700">{s.units}</span>
                                        <button onClick={() => handleUpdateStock(s.group, s.units + 1)} className="w-8 h-8 bg-white border border-slate-300 rounded hover:bg-green-50 hover:text-green-600 hover:border-green-200 font-bold transition-all">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors">Done</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Requisition Modal Portal */}
            {activeModal === 'requisition' && createPortal(
                 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-slate-800">New Blood Requisition</h3>
                            <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleRequisition} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Patient Name / ID</label>
                                <input 
                                    required 
                                    type="text" 
                                    className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-slate-800 text-white placeholder-slate-400 outline-none text-sm font-medium transition-all" 
                                    placeholder="Enter Patient Name or UHID" 
                                    value={reqForm.patientName} 
                                    onChange={e => setReqForm({...reqForm, patientName: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Blood Group</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-slate-800 text-white outline-none text-sm font-medium appearance-none cursor-pointer transition-all" 
                                        value={reqForm.bloodGroup} 
                                        onChange={e => setReqForm({...reqForm, bloodGroup: e.target.value})}
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Units Required</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-slate-800 text-white placeholder-slate-400 outline-none text-sm font-medium transition-all" 
                                        value={reqForm.units} 
                                        onChange={e => setReqForm({...reqForm, units: parseInt(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Urgency</label>
                                <select 
                                    className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-slate-800 text-white outline-none text-sm font-medium appearance-none cursor-pointer transition-all" 
                                    value={reqForm.urgency} 
                                    onChange={e => setReqForm({...reqForm, urgency: e.target.value})}
                                >
                                    <option>Routine</option>
                                    <option>Urgent</option>
                                    <option>Critical / Stat</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3.5 bg-red-600 text-white font-bold text-base rounded-xl mt-4 hover:bg-red-700 shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-0.5">
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Donor Modal Portal */}
            {activeModal === 'donor' && createPortal(
                 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-slate-800">Register Blood Donor</h3>
                            <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleDonate} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Donor Name</label>
                                <input required type="text" className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 outline-none text-sm font-medium" placeholder="Full Name" value={donorForm.name} onChange={e => setDonorForm({...donorForm, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Blood Group</label>
                                    <select className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white outline-none text-sm font-medium" value={donorForm.bloodGroup} onChange={e => setDonorForm({...donorForm, bloodGroup: e.target.value})}>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Mobile</label>
                                    <input required type="tel" className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 outline-none text-sm font-medium" placeholder="10-digit Mobile" value={donorForm.mobile} onChange={e => setDonorForm({...donorForm, mobile: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Age</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 outline-none text-sm font-medium" placeholder="Years" value={donorForm.age} onChange={e => setDonorForm({...donorForm, age: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Weight (kg)</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 outline-none text-sm font-medium" placeholder="Kg" value={donorForm.weight} onChange={e => setDonorForm({...donorForm, weight: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Last Donation Date</label>
                                <input type="date" className="w-full px-4 py-3 bg-slate-700 border border-transparent rounded-lg focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 outline-none text-sm font-medium" value={donorForm.lastDonation} onChange={e => setDonorForm({...donorForm, lastDonation: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-3.5 bg-green-600 text-white font-bold text-base rounded-xl mt-4 hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5">
                                Register & Add Stock
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Droplet className="w-6 h-6 text-red-600" /> 
                {selectedHospital === 'All' ? 'Central Blood Bank Network' : `${selectedHospital} Blood Storage Unit`}
            </h2>
            <p className="text-slate-600 mb-6">Inventory management and Donor database integrated with IPD requisitions.</p>
            
            <div className={`p-4 border rounded-lg text-sm flex items-start gap-3 ${
                systemAlert.type === 'red' ? 'bg-red-50 border-red-200 text-red-800' :
                systemAlert.type === 'yellow' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-green-50 border-green-200 text-green-800'
            }`}>
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                     systemAlert.type === 'red' ? 'bg-red-600 animate-pulse' :
                     systemAlert.type === 'yellow' ? 'bg-amber-600' :
                     'bg-green-600'
                }`}></div>
                <strong>System Message: {systemAlert.text}</strong>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Current Blood Stock Levels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stock.map((stock: any) => {
                    // Logic to determine status display
                    const isCritical = stock.units < 10;
                    const isLow = stock.units < 25;
                    
                    return (
                        <div key={stock.group} className={`p-4 border rounded-lg text-center transition-all ${
                            isCritical ? 'bg-red-50 border-red-200' : 
                            isLow ? 'bg-amber-50 border-amber-200' : 
                            'bg-white border-slate-100 hover:border-blue-200'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl font-black text-slate-800">{stock.group}</span>
                                {isCritical && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">CRITICAL</span>}
                            </div>
                            
                            <div className="flex items-end justify-center gap-1 mb-1">
                                <span className={`text-3xl font-bold ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                                    {stock.units}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mb-1.5">units</span>
                            </div>
                            
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                                <div 
                                    className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min((stock.units / 60) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-2 text-sm">Action Items</h4>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setActiveModal('requisition')}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        Create Requisition
                    </button>
                    <button 
                        onClick={() => setActiveModal('donor')}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        Register Donor
                    </button>
                    <button 
                        onClick={() => setActiveModal('update')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 ml-auto transition-colors"
                    >
                        Update Stock Counts
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<'dashboard' | 'registration' | 'patients' | 'clinical' | 'icu' | 'bloodbank' | 'dello' | 'billing' | 'emergency' | 'pharmacy'>('dashboard');
  const [selectedHospital, setSelectedHospital] = useState<HospitalName | 'All'>('All');
  
  // Ref for the main scrollable content area
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Centralized State with LocalStorage Persistence
  const [patients, setPatients] = useState<Patient[]>(() => {
      const saved = localStorage.getItem('patients');
      return saved ? JSON.parse(saved) : MOCK_PATIENTS;
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
      const saved = localStorage.getItem('invoices');
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [wards, setWards] = useState<Ward[]>(() => {
      const saved = localStorage.getItem('wards');
      return saved ? JSON.parse(saved) : MOCK_WARDS;
  });

  const [referrals, setReferrals] = useState<Referral[]>(() => {
      const saved = localStorage.getItem('referrals');
      return saved ? JSON.parse(saved) : MOCK_REFERRALS;
  });

  useEffect(() => {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
      localStorage.setItem('patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
      localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
      localStorage.setItem('wards', JSON.stringify(wards));
  }, [wards]);

  useEffect(() => {
      localStorage.setItem('referrals', JSON.stringify(referrals));
  }, [referrals]);

  // Scroll to top whenever the active module changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeModule]);

  const handleRegister = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
      setPatients((prev) => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDeletePatient = (patientId: string) => {
      setPatients((prev) => prev.filter(p => p.id !== patientId));
  };

  const handleAddInvoice = (inv: Invoice) => {
      setInvoices((prev) => [inv, ...prev]);
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
      setInvoices((prev) => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  // Shared function to update bed status from any module (Registration, Emergency, Clinical, ICU)
  const updateBedStatus = (wardId: string, bedId: string, status: BedStatus, patientId?: string) => {
    setWards(prevWards => prevWards.map(ward => {
        if (ward.id === wardId) {
            return {
                ...ward,
                beds: ward.beds.map(bed => {
                    if (bed.id === bedId) {
                        return { ...bed, status, patientId: status === BedStatus.OCCUPIED ? patientId : undefined };
                    }
                    return bed;
                })
            };
        }
        return ward;
    }));
  };

  const handleAcceptReferral = (referralId: string) => {
      setReferrals(prev => prev.map(ref => ref.id === referralId ? { ...ref, status: 'Admitted' } : ref));
      alert("Referral Accepted. Patient marked as Admitted in Dello+ records. Proceed to Registration to create full hospital record.");
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      // If user is restricted to a hospital, set it immediately
      if (user.hospital) {
          setSelectedHospital(user.hospital);
      } else {
          setSelectedHospital('All');
      }

      // Determine default module based on role
      if ([UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN].includes(user.role)) {
          setActiveModule('dashboard');
      } else if (user.role === UserRole.RECEPTIONIST) {
          setActiveModule('registration');
      } else if (user.role === UserRole.BLOOD_BANK_MANAGER) {
          setActiveModule('bloodbank');
      } else if (user.role === UserRole.CASUALTY_MO) {
          setActiveModule('emergency');
      } else if (user.role === UserRole.PHARMACIST) {
          setActiveModule('pharmacy');
      } else if (user.role === UserRole.ACCOUNTANT) {
          setActiveModule('billing');
      } else {
          // Consultant, Lab Tech, Pathologist, Radiologist, Dept Admin, Staff Nurse etc.
          setActiveModule('clinical');
      }
  }

  const handleLogout = () => {
      setCurrentUser(null);
      setSelectedHospital('All');
      // Optional: Clear persisted state if security requirement demands it, but for UX we keep session until explicit logout
      localStorage.removeItem('currentUser'); 
  }

  // Define Modules with Permission Checks
  const navItems = [
    { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: LayoutDashboard,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN] 
    },
    { 
        id: 'registration', 
        label: 'OPD / Registration', 
        icon: UserPlus,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST] 
    },
    { 
        id: 'patients', 
        label: 'Patients Database', 
        icon: Users,
        roles: [
            UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST, 
            UserRole.CONSULTANT, UserRole.STAFF_NURSE, UserRole.LAB_TECHNICIAN,
            UserRole.PATHOLOGIST, UserRole.RADIOLOGIST, UserRole.CASUALTY_MO,
            UserRole.PHARMACIST, UserRole.ACCOUNTANT
        ] 
    },
    { 
        id: 'emergency', 
        label: 'Emergency / Casualty', 
        icon: Siren,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.CASUALTY_MO, UserRole.CONSULTANT, UserRole.STAFF_NURSE]
    },
    { 
        id: 'icu', 
        label: 'ICU Management', 
        icon: HeartPulse,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.CONSULTANT, UserRole.STAFF_NURSE, UserRole.CASUALTY_MO]
    },
    { 
        id: 'clinical', 
        label: 'IPD & Clinical Wards', 
        icon: Activity,
        roles: [
            UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.CONSULTANT, 
            UserRole.STAFF_NURSE, UserRole.LAB_TECHNICIAN, UserRole.DEPT_ADMIN, 
            UserRole.CASUALTY_MO, UserRole.PATHOLOGIST, UserRole.RADIOLOGIST
        ] 
    },
    { 
        id: 'billing', 
        label: 'Billing', 
        icon: CreditCard,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT]
    },
    { 
        id: 'pharmacy', 
        label: 'Pharmacy', 
        icon: Pill,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PHARMACIST]
    },
    { 
        id: 'bloodbank', 
        label: 'Blood Bank', 
        icon: Droplet,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.BLOOD_BANK_MANAGER]
    },
    { 
        id: 'dello', 
        label: 'Dello+ Referrals', 
        icon: Share2,
        roles: [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.CONSULTANT]
    },
  ];

  // Filter Nav Items based on Role
  const visibleNavItems = navItems.filter(item => {
      if (!currentUser) return false;
      return item.roles.includes(currentUser.role);
  });

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-sm`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
                M
            </div>
            {sidebarOpen && (
                <div className="leading-tight">
                    <h1 className="font-bold text-slate-800 text-sm">MMC & RI</h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Integrated HMIS</span>
                </div>
            )}
          </div>
          {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Menu className="w-4 h-4" />
              </button>
          )}
        </div>

        {/* Hospital Context Selector */}
        {sidebarOpen && (
            <div className="px-3 py-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Select Facility</label>
                <div className="relative">
                    <select 
                        value={selectedHospital}
                        onChange={(e) => setSelectedHospital(e.target.value as HospitalName | 'All')}
                        disabled={!!currentUser.hospital} // Lock if user has restricted access
                        className={`w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${!currentUser.hospital ? 'cursor-pointer' : 'cursor-not-allowed bg-slate-100 text-slate-500'}`}
                    >
                        {!currentUser.hospital && <option value="All">All Campus View</option>}
                        {Object.values(HospitalName).map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                    {!currentUser.hospital && (
                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    )}
                </div>
            </div>
        )}

        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeModule === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeModule === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
             {sidebarOpen ? (
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                            <span className="text-xs font-bold text-slate-600">{currentUser.avatar || 'U'}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 truncate w-24">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase truncate w-24">{currentUser.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors" title="Logout">
                        <LogOut className="w-4 h-4" />
                    </button>
                 </div>
             ) : (
                 <div className="flex justify-center">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-400">
                        <Menu className="w-5 h-5" />
                    </button>
                 </div>
             )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
            <h2 className="text-lg font-bold text-slate-800">
                {visibleNavItems.find(n => n.id === activeModule)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                    <Building2 className="w-3 h-3" />
                    {selectedHospital === 'All' ? 'MMC&RI Integrated Campus' : selectedHospital}
                </div>
            </div>
        </header>

        {/* Scrollable Area with Ref */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-8">
            {activeModule === 'dashboard' && <Dashboard selectedHospital={selectedHospital} />}
            {activeModule === 'registration' && (
                <Registration 
                    onRegister={handleRegister}
                    onAddInvoice={handleAddInvoice}
                    selectedHospital={selectedHospital} 
                    patients={patients}
                    wards={wards}
                />
            )}
            {activeModule === 'patients' && (
                <PatientsDB 
                    patients={patients}
                    selectedHospital={selectedHospital}
                    onUpdatePatient={handleUpdatePatient}
                    onDeletePatient={handleDeletePatient}
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
            {activeModule === 'clinical' && (
                <Clinical 
                    selectedHospital={selectedHospital} 
                    patients={patients}
                    currentUser={currentUser}
                    wards={wards}
                    updateBedStatus={updateBedStatus}
                    onUpdatePatient={handleUpdatePatient}
                    onAddInvoice={handleAddInvoice}
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
            {activeModule === 'bloodbank' && <BloodBank selectedHospital={selectedHospital} />}
            {activeModule === 'pharmacy' && <Pharmacy />}
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