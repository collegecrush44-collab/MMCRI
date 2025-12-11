
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pill, Search, Plus, ShoppingCart, Trash2, AlertTriangle, FileText, CheckCircle, Package, RefreshCw, X, IndianRupee, Calendar } from 'lucide-react';
import { Patient, Invoice } from '../types';
import SearchableSelect from './SearchableSelect';

interface PharmacyProps {
    patients: Patient[];
    onAddInvoice: (inv: Invoice) => void;
}

interface Medicine {
    id: string;
    name: string;
    category: 'Tablet' | 'Syrup' | 'Injection' | 'Capsule' | 'Drops' | 'Ointment' | 'Consumable';
    batchNo: string;
    expiry: string;
    stock: number;
    price: number;
    location: string;
}

interface CartItem extends Medicine {
    qty: number;
}

const MOCK_INVENTORY: Medicine[] = [
    { id: 'MED001', name: 'Paracetamol 650mg', category: 'Tablet', batchNo: 'B123', expiry: '2025-12-31', stock: 500, price: 2, location: 'R1-A' },
    { id: 'MED002', name: 'Amoxicillin 500mg', category: 'Capsule', batchNo: 'B124', expiry: '2024-10-15', stock: 45, price: 8, location: 'R2-B' },
    { id: 'MED003', name: 'Pantoprazole 40mg', category: 'Tablet', batchNo: 'B125', expiry: '2025-06-30', stock: 200, price: 5, location: 'R1-C' },
    { id: 'MED004', name: 'Cough Syrup (100ml)', category: 'Syrup', batchNo: 'S001', expiry: '2024-08-20', stock: 15, price: 85, location: 'R3-A' },
    { id: 'MED005', name: 'Insulin Glargine', category: 'Injection', batchNo: 'IN09', expiry: '2024-12-12', stock: 8, price: 450, location: 'Fridge' },
    { id: 'MED006', name: 'Cetirizine 10mg', category: 'Tablet', batchNo: 'B126', expiry: '2026-01-01', stock: 1000, price: 3, location: 'R1-B' },
    { id: 'MED007', name: 'Metformin 500mg', category: 'Tablet', batchNo: 'B127', expiry: '2025-05-20', stock: 300, price: 4, location: 'R2-A' },
    { id: 'MED008', name: 'IV Set', category: 'Consumable', batchNo: 'IV01', expiry: '2027-01-01', stock: 50, price: 120, location: 'R4-D' },
    { id: 'MED009', name: 'Normal Saline (500ml)', category: 'Injection', batchNo: 'NS99', expiry: '2025-03-15', stock: 12, price: 35, location: 'R4-A' },
    { id: 'MED010', name: 'Atorvastatin 10mg', category: 'Tablet', batchNo: 'B128', expiry: '2025-11-30', stock: 150, price: 12, location: 'R2-C' },
];

const Pharmacy: React.FC<PharmacyProps> = ({ patients, onAddInvoice }) => {
    const [activeTab, setActiveTab] = useState<'dispense' | 'inventory'>('dispense');
    const [inventory, setInventory] = useState<Medicine[]>(MOCK_INVENTORY);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Add Medicine Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMed, setNewMed] = useState<Partial<Medicine>>({ category: 'Tablet', stock: 0, price: 0 });

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    // Derived Inventory Lists
    const lowStockItems = inventory.filter(m => m.stock < 20);
    const expiringSoonItems = inventory.filter(m => {
        const exp = new Date(m.expiry);
        const today = new Date();
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 90;
    });

    const filteredInventory = inventory.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Cart Calculations
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Handlers
    const addToCart = (med: Medicine) => {
        const existing = cart.find(i => i.id === med.id);
        if (existing) {
            if (existing.qty < med.stock) {
                setCart(cart.map(i => i.id === med.id ? { ...i, qty: i.qty + 1 } : i));
            } else {
                alert(`Cannot add more. Only ${med.stock} units available.`);
            }
        } else {
            if (med.stock > 0) {
                setCart([...cart, { ...med, qty: 1 }]);
            } else {
                alert("Item is out of stock!");
            }
        }
    };

    const updateQty = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                const stock = inventory.find(m => m.id === id)?.stock || 0;
                if (newQty > 0 && newQty <= stock) {
                    return { ...item, qty: newQty };
                }
                return item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const handleDispense = () => {
        if (!selectedPatient) {
            alert("Please select a patient first.");
            return;
        }
        if (cart.length === 0) return;

        // Create Invoice
        const newInvoice: Invoice = {
            id: `INV-PH-${Math.floor(Math.random() * 10000)}`,
            patientName: selectedPatient.name,
            uhid: selectedPatient.uhid,
            date: new Date().toISOString().split('T')[0],
            amount: cartTotal,
            status: 'Paid',
            mode: 'Cash',
            scheme: selectedPatient.admissionType || 'General',
            items: cart.map(i => `${i.name} x${i.qty}`),
            breakdown: { other: cartTotal }
        };

        onAddInvoice(newInvoice);

        // Update Inventory Stock
        const updatedInventory = inventory.map(med => {
            const cartItem = cart.find(c => c.id === med.id);
            if (cartItem) {
                return { ...med, stock: med.stock - cartItem.qty };
            }
            return med;
        });
        setInventory(updatedInventory);

        // Reset
        setCart([]);
        setSelectedPatientId('');
        alert("Medicines Dispensed Successfully!");
    };

    const handleAddMedicine = (e: React.FormEvent) => {
        e.preventDefault();
        const med: Medicine = {
            id: `MED${Math.floor(Math.random() * 10000)}`,
            name: newMed.name || 'Unknown',
            category: newMed.category as any,
            batchNo: newMed.batchNo || 'N/A',
            expiry: newMed.expiry || '',
            stock: Number(newMed.stock),
            price: Number(newMed.price),
            location: newMed.location || 'Store'
        };
        setInventory([...inventory, med]);
        setShowAddModal(false);
        setNewMed({ category: 'Tablet', stock: 0, price: 0 });
    };

    // Options for search
    const patientOptions = patients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));
    const medicineOptions = filteredInventory.map(m => ({ 
        label: `${m.name} - Stock: ${m.stock}`, 
        value: m.id, 
        group: m.category 
    }));

    const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

    return (
        <div className="space-y-6 animate-slide-down">
            {/* Add Medicine Modal */}
            {showAddModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Add New Medicine</h3>
                            <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <form onSubmit={handleAddMedicine}>
                            <div className="p-6 space-y-4">
                                <div><label className={labelClass}>Medicine Name</label><input required className={inputClass} value={newMed.name || ''} onChange={e => setNewMed({...newMed, name: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select className={inputClass} value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value as any})}>
                                            {['Tablet', 'Syrup', 'Injection', 'Capsule', 'Drops', 'Ointment', 'Consumable'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div><label className={labelClass}>Batch No</label><input required className={inputClass} value={newMed.batchNo || ''} onChange={e => setNewMed({...newMed, batchNo: e.target.value})} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClass}>Stock</label><input required type="number" className={inputClass} value={newMed.stock} onChange={e => setNewMed({...newMed, stock: parseInt(e.target.value)})} /></div>
                                    <div><label className={labelClass}>Price (₹)</label><input required type="number" className={inputClass} value={newMed.price} onChange={e => setNewMed({...newMed, price: parseFloat(e.target.value)})} /></div>
                                    <div><label className={labelClass}>Location</label><input className={inputClass} value={newMed.location || ''} placeholder="Rack" onChange={e => setNewMed({...newMed, location: e.target.value})} /></div>
                                </div>
                                <div><label className={labelClass}>Expiry Date</label><input required type="date" className={inputClass} value={newMed.expiry || ''} onChange={e => setNewMed({...newMed, expiry: e.target.value})} /></div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">Add Item</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Pill className="w-8 h-8 text-teal-600" /> Pharmacy Management
                    </h1>
                    <p className="text-slate-500 text-sm">Dispensing & Inventory Control</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('dispense')}
                        className={`px-6 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'dispense' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <ShoppingCart className="w-4 h-4" /> Dispense
                    </button>
                    <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <Package className="w-4 h-4" /> Inventory
                    </button>
                </div>
            </div>

            {/* Alerts Section */}
            {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lowStockItems.length > 0 && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-red-800">Low Stock Alert</h4>
                                <p className="text-xs text-red-600 mt-1">
                                    {lowStockItems.length} items are running low (stock {'<'} 20). Please restock soon.
                                </p>
                            </div>
                        </div>
                    )}
                    {expiringSoonItems.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800">Expiry Alert</h4>
                                <p className="text-xs text-amber-600 mt-1">
                                    {expiringSoonItems.length} items are expiring within 3 months.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* DISPENSE TAB */}
            {activeTab === 'dispense' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Add */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <h3 className="font-bold text-slate-800">Select Medicines</h3>
                            <SearchableSelect 
                                options={medicineOptions} 
                                value="" 
                                onChange={(val) => {
                                    const med = inventory.find(m => m.id === val);
                                    if(med) addToCart(med);
                                }}
                                placeholder="Search medicine by name or category..." 
                            />
                        </div>

                        {/* Cart */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-700">
                                Current Bill Items
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3">Medicine</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cart.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                    Cart is empty. Add medicines to proceed.
                                                </td>
                                            </tr>
                                        ) : (
                                            cart.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500">{item.batchNo} • Exp: {item.expiry}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm">₹{item.price}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">-</button>
                                                            <span className="w-4 text-center font-bold text-sm">{item.qty}</span>
                                                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-sm">₹{item.price * item.qty}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        {/* Patient Select */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Patient Details</h3>
                            <SearchableSelect 
                                options={patientOptions} 
                                value={selectedPatientId} 
                                onChange={setSelectedPatientId}
                                placeholder="Search Patient (UHID/Name)..." 
                            />
                            {selectedPatient && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="font-bold text-blue-900 text-sm">{selectedPatient.name}</p>
                                    <p className="text-xs text-blue-700">{selectedPatient.age}Y / {selectedPatient.gender}</p>
                                    <p className="text-xs text-blue-700 mt-1">UHID: {selectedPatient.uhid}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-white border border-blue-200 text-blue-700 text-[10px] font-bold rounded uppercase">
                                        {selectedPatient.type}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bill Summary */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Bill Summary</h3>
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Items Total</span>
                                    <span>{cart.reduce((acc, i) => acc + i.qty, 0)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>₹ {cartTotal}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-lg text-slate-800">
                                    <span>Total Payable</span>
                                    <span>₹ {cartTotal}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleDispense}
                                disabled={!selectedPatient || cart.length === 0}
                                className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" /> Generate Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Medicine
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Medicine Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Batch / Expiry</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInventory.map(med => (
                                    <tr key={med.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">{med.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600">{med.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            <div className="font-mono">{med.batchNo}</div>
                                            <div className={`${new Date(med.expiry) < new Date() ? 'text-red-600 font-bold' : 'text-slate-500'}`}>Exp: {med.expiry}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{med.location}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${med.stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {med.stock} Units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">₹{med.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredInventory.length === 0 && (
                            <div className="p-8 text-center text-slate-400">No medicines found matching your search.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pharmacy;
