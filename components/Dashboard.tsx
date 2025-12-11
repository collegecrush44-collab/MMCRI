
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Activity, BedDouble, FileText, Droplet, ChevronDown } from 'lucide-react';
import { HospitalName } from '../types';
import { BLOOD_STOCK } from '../services/mockData';

interface DashboardProps {
  selectedHospital: HospitalName | 'All';
}

const COLORS = ['#ef4444', '#22c55e'];

// Mock Data Configuration per Hospital Level
const HOSPITAL_STATS: any = {
  'All': {
    opd: 4850,
    ipd: 1680,
    surgeries: 85,
    labPending: 420,
    occupancyData: [
      { name: 'Occupied', value: 1450 },
      { name: 'Available', value: 350 },
    ],
  },
  [HospitalName.KR_HOSPITAL]: {
    opd: 2450,
    ipd: 820,
    surgeries: 25,
    labPending: 210,
    occupancyData: [
      { name: 'Occupied', value: 780 },
      { name: 'Available', value: 120 },
    ],
  },
  [HospitalName.CHELUVAMBA]: {
    opd: 1200,
    ipd: 450,
    surgeries: 35,
    labPending: 120,
    occupancyData: [
      { name: 'Occupied', value: 420 },
      { name: 'Available', value: 30 },
    ],
  },
  [HospitalName.KRISHNAJAMMANI]: {
    opd: 800,
    ipd: 280,
    surgeries: 12,
    labPending: 60,
    occupancyData: [
      { name: 'Occupied', value: 200 },
      { name: 'Available', value: 100 },
    ],
  },
  [HospitalName.TRAUMA_CARE]: {
    opd: 400,
    ipd: 130,
    surgeries: 13,
    labPending: 30,
    occupancyData: [
      { name: 'Occupied', value: 50 },
      { name: 'Available', value: 100 },
    ],
  }
};

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-semibold">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  </div>
);

// Deterministic Pseudo-Random for consistent mock data per date
const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const Dashboard: React.FC<DashboardProps> = ({ selectedHospital }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const getStatsForDate = (dateStr: string) => {
      const baseStats = HOSPITAL_STATS[selectedHospital] || HOSPITAL_STATS['All'];
      const d = new Date(dateStr);
      const daySeed = d.getDate() + (d.getMonth() * 31) + (d.getFullYear() * 365);
      // Ensure specific random factor based on selectedHospital string length to vary per hospital
      const hospitalSeed = selectedHospital.length;
      const factor = 0.7 + (pseudoRandom(daySeed + hospitalSeed) * 0.5); 
      
      return {
          opd: Math.floor(baseStats.opd * factor),
          surgeries: Math.floor(baseStats.surgeries * factor),
          ipdCensus: Math.floor(baseStats.ipd * factor),
          labPending: Math.floor(baseStats.labPending * factor),
          occupancyData: baseStats.occupancyData,
          dateDisplay: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      };
  };

  // 1. Calculate Aggregated Stats based on Trend Period
  const periodStats = useMemo(() => {
    let daysToSum = 0;
    let labelSuffix = 'Today';

    if (trendPeriod === 'weekly') {
        daysToSum = 7;
        labelSuffix = 'Last 7 Days';
    } else if (trendPeriod === 'monthly') {
        daysToSum = 30;
        labelSuffix = 'Last 30 Days';
    } else {
        daysToSum = 1;
        labelSuffix = 'Selected Date';
    }

    let opdTotal = 0;
    let surgeriesTotal = 0;
    
    // Iterate backwards from selectedDate to sum flow metrics
    const d = new Date(selectedDate);
    // Adjust start date for loop (inclusive of end date)
    d.setDate(d.getDate() - (daysToSum - 1));

    for (let i = 0; i < daysToSum; i++) {
        const dateStr = d.toISOString().split('T')[0];
        const stats = getStatsForDate(dateStr);
        opdTotal += stats.opd;
        surgeriesTotal += stats.surgeries;
        d.setDate(d.getDate() + 1);
    }

    // For Stock metrics (Census, Queue, Occupancy), we use the Snapshot at the end date (selectedDate)
    // Summing census days is not typically useful for this dashboard view
    const snapshotStats = getStatsForDate(selectedDate);

    return {
        opd: opdTotal,
        surgeries: surgeriesTotal,
        ipdCensus: snapshotStats.ipdCensus,
        labPending: snapshotStats.labPending,
        occupancyData: snapshotStats.occupancyData,
        opdLabel: `Visits (${labelSuffix})`,
        surgeriesLabel: `Procedures (${labelSuffix})`
    };
  }, [selectedHospital, selectedDate, trendPeriod]);


  // 2. Calculate Trend Data for Charts
  const trendData = useMemo(() => {
    const data = [];
    const endDate = new Date(selectedDate);
    let daysToSubtract = 0;

    if (trendPeriod === 'weekly') daysToSubtract = 6; // Last 7 days including today
    if (trendPeriod === 'monthly') daysToSubtract = 29; // Last 30 days
    if (trendPeriod === 'daily') daysToSubtract = 0; // Just today

    // Start date
    const d = new Date(endDate);
    d.setDate(d.getDate() - daysToSubtract);

    while (d <= endDate) {
        const dateStr = d.toISOString().split('T')[0];
        const stats = getStatsForDate(dateStr);
        data.push({
            name: stats.dateDisplay,
            opd: stats.opd,
            ipd: Math.floor(stats.ipdCensus * 0.15) // Approx admissions
        });
        d.setDate(d.getDate() + 1);
    }
    return data;
  }, [selectedHospital, selectedDate, trendPeriod]);


  const occupancyRate = periodStats.occupancyData 
      ? Math.round((periodStats.occupancyData[0].value / (periodStats.occupancyData[0].value + periodStats.occupancyData[1].value)) * 100)
      : 0;
  
  // Blood Stock Calculation
  const criticalStock = BLOOD_STOCK.filter(b => b.units < 10);
  const totalUnits = BLOOD_STOCK.reduce((acc, curr) => acc + curr.units, 0);

  return (
    <div className="space-y-6 animate-slide-down">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {selectedHospital === 'All' ? 'Integrated Campus Overview' : `${selectedHospital} Dashboard`}
          </h1>
          <p className="text-slate-500 text-sm">
             Operational metrics for <strong>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[10px] font-bold text-slate-400 uppercase">Date</span>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={todayStr}
                        onKeyDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                            try {
                                e.currentTarget.showPicker();
                            } catch (err) {
                                // Fallback for browsers not supporting showPicker
                            }
                        }}
                        className="pl-10 pr-2 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm h-9 cursor-pointer"
                    />
                </div>
                
                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <div className="relative">
                    <select 
                        value={trendPeriod}
                        onChange={(e) => setTrendPeriod(e.target.value as any)}
                        className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm h-9 appearance-none cursor-pointer min-w-[130px]"
                    >
                        <option value="daily">Daily View</option>
                        <option value="weekly">Weekly Trend</option>
                        <option value="monthly">Monthly Trend</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
             </div>

            <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2 shadow-sm h-9">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                ABDM Live
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="OPD Registrations" 
            value={periodStats.opd.toLocaleString()} 
            sub={periodStats.opdLabel}
            icon={Users} 
            color="bg-blue-600" 
        />
        <StatCard 
            title="Active In-Patients" 
            value={periodStats.ipdCensus.toLocaleString()} 
            sub="Current Census (Snapshot)" 
            icon={BedDouble} 
            color="bg-indigo-600" 
        />
        <StatCard 
            title="Surgeries Done" 
            value={periodStats.surgeries} 
            sub={periodStats.surgeriesLabel}
            icon={Activity} 
            color="bg-rose-600" 
        />
        <StatCard 
            title="Pending Reports" 
            value={periodStats.labPending} 
            sub="Current Queue (Snapshot)" 
            icon={FileText} 
            color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Patient Flow Trends</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                {trendPeriod === 'daily' ? 'Single Day View' : trendPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
        </div>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={trendPeriod === 'monthly' ? 4 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="opd" fill="#3b82f6" radius={[4, 4, 0, 0]} name="OPD Visits" />
                <Bar dataKey="ipd" fill="#6366f1" radius={[4, 4, 0, 0]} name="New Admissions" />
            </BarChart>
            </ResponsiveContainer>
        </div>
        </div>

        <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Bed Occupancy</h3>
                {periodStats.occupancyData && (
                    <div className="h-40 w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={periodStats.occupancyData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {periodStats.occupancyData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-2xl font-bold text-slate-800">{occupancyRate}%</span>
                            <span className="text-[10px] text-slate-500">Occupied</span>
                        </div>
                    </div>
                )}
                {periodStats.occupancyData && (
                    <div className="mt-2 flex justify-center space-x-6">
                        <div className="flex items-center">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-xs text-slate-600 font-medium">Occupied ({periodStats.occupancyData[0].value})</span>
                        </div>
                        <div className="flex items-center">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-xs text-slate-600 font-medium">Available ({periodStats.occupancyData[1].value})</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Blood Availability Widget */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-red-600" /> Blood Availability
                    </h3>
                    <span className="text-xs font-bold text-slate-500">{totalUnits} units</span>
                </div>
                
                {criticalStock.length > 0 ? (
                    <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        Critical Low: {criticalStock.map(s => s.group).join(', ')}
                    </div>
                ) : (
                    <div className="mb-3 p-2 bg-green-50 border border-green-100 rounded text-xs text-green-700">
                        All blood groups are well stocked.
                    </div>
                )}

                <div className="grid grid-cols-4 gap-2 text-center">
                    {BLOOD_STOCK.slice(0, 4).map(stock => (
                        <div key={stock.group} className="p-1.5 bg-slate-50 rounded border border-slate-100">
                            <div className="text-[10px] text-slate-500 font-bold">{stock.group}</div>
                            <div className={`text-sm font-bold ${stock.units < 10 ? 'text-red-600' : 'text-slate-800'}`}>{stock.units}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
