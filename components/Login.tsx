import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_AUTH_DB } from '../services/mockData';
import { ShieldCheck, ChevronRight, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const account = MOCK_AUTH_DB.find(
        u => u.username === username && u.password === password
    );

    if (account) {
        onLogin(account.user);
    } else {
        setError('Invalid username or password. Please try again.');
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-xl flex overflow-hidden border border-slate-200 min-h-[550px]">
        
        {/* Left Side: Branding */}
        <div className="w-2/5 bg-gradient-to-br from-blue-700 to-indigo-800 p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-3xl mb-8 backdrop-blur-md shadow-inner border border-white/10">
                M
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">MMC & RI</h1>
            <h2 className="text-xl font-light text-blue-100 mb-6">Integrated HMIS</h2>
            <div className="h-1 w-12 bg-blue-400 rounded-full mb-6"></div>
            <p className="text-sm text-blue-200 leading-relaxed opacity-90 font-medium">
              Mysore Medical College & Research Institute<br/>
              Unified Hospital Management System<br/>
              ABDM Compliant • Multi-Specialty
            </p>
          </div>

          <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Available Credentials (Demo)</h3>
              <div className="text-[10px] space-y-1 text-blue-100 opacity-80 font-mono bg-black/20 p-3 rounded-lg border border-white/10">
                  <div className="flex justify-between"><span>Admin</span> <span>admin / password</span></div>
                  <div className="flex justify-between"><span>K R Hosp</span> <span>krh_admin / password</span></div>
                  <div className="flex justify-between"><span>Doctor</span> <span>dr_suresh / password</span></div>
                  <div className="flex justify-between"><span>Nurse</span> <span>nurse_cheluvamba / password</span></div>
                  <div className="flex justify-between"><span>Reception</span> <span>reception / password</span></div>
              </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 p-12 flex flex-col justify-center bg-white relative">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                    Secure Login
                </h2>
                <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access the facility portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div>
                    <label className={labelClass}>Username</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input 
                            type="text"
                            className={inputClass}
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input 
                            type="password"
                            className={inputClass}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        Remember me
                    </label>
                    <a href="#" className="text-blue-600 hover:underline font-medium">Forgot Password?</a>
                </div>

                <button 
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4"
                >
                    Access System <ChevronRight className="w-4 h-4" />
                </button>

            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    System Operational • v2.4.0
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;