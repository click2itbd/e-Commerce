import React, { useState, useEffect } from 'react';
import {
  Server, Settings, Globe, Plus, Trash2, Edit2, CheckCircle2, Eye, EyeOff, Save, Plug, Shield, RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BtclSettingsCard } from './BtclSettingsCard';
import { apiPost } from '../../../services/apiClient';

const REGISTRAR_DOC_PATH = ['hosting_config', 'registrar_settings'];

const defaultRegistrarState = {
  openprovider: { enabled: true, username: '', password: '', isSandbox: true },
};

export function DomainRegistrarsModule() {
  const [state, setState] = useState(defaultRegistrarState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({ openprovider: false });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, REGISTRAR_DOC_PATH[0], REGISTRAR_DOC_PATH[1]));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({
          ...prev,
          openprovider: { ...prev.openprovider, ...data.openprovider }
        }));
      }
    } catch (error) {
      console.error('Error loading registrar settings:', error);
      toast.error('Failed to load registrar settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (registrar: string, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      [registrar]: { ...prev[registrar], [field]: value }
    }));
  };

  const saveOne = async (registrar: string) => {
    setSaving(true);
    try {
      await setDoc(doc(db, REGISTRAR_DOC_PATH[0], REGISTRAR_DOC_PATH[1]), { [registrar]: state[registrar] }, { merge: true });
      toast.success(`${registrar.charAt(0).toUpperCase() + registrar.slice(1)} settings saved successfully`);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (registrar: string) => {
    setTesting(true);
    try {
      if (!state[registrar].username || !state[registrar].password) {
        toast.error('Please enter both username and password/token');
        setTesting(false);
        return;
      }

      const res: any = await apiPost('/api/admin/domain/test-connection', { 
        provider: registrar, 
        config: state[registrar] 
      });

      if (res.success) {
        toast.success(res.message || `Connection to ${registrar} successful!`);
      } else {
        toast.error(res.message || 'Authentication failed');
      }
    } catch (e: any) {
      toast.error('Connection failed: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  const toggleShow = (registrar: string) => {
    setShowKeys(prev => ({ ...prev, [registrar]: !prev[registrar] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="text-center py-12 text-slate-500">Loading registrar settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Domain Registrars</h2>
            <p className="text-slate-500 mt-1 text-sm max-w-2xl">
              Configure the registrar APIs used to automatically register, transfer, and renew domains, as well as manage DNS and SSL certificates.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Openprovider API Section */}
          <div className="border-2 border-slate-100 rounded-2xl overflow-hidden transition-all focus-within:border-blue-200 focus-within:shadow-md">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-700 text-lg">Openprovider API (Primary)</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.openprovider.enabled}
                  onChange={(e) => handleUpdate('openprovider', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-600">Enabled</span>
              </label>
            </div>
            
            <div className={cn("p-6 space-y-5 transition-opacity", !state.openprovider.enabled && "opacity-60 pointer-events-none")}>
              <p className="text-sm text-slate-500 mb-4">
                Openprovider is used as the primary provider for domain search, registration, DNS Zone management, and SSL provisioning.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username / Handle</label>
                  <input
                    type="text"
                    value={state.openprovider.username}
                    onChange={(e) => handleUpdate('openprovider', 'username', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. JD000000-EA"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password / API Token</label>
                  <div className="relative">
                    <input
                      type={showKeys.openprovider ? "text" : "password"}
                      value={state.openprovider.password}
                      onChange={(e) => handleUpdate('openprovider', 'password', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter Openprovider password"
                    />
                    <button type="button" onClick={() => toggleShow('openprovider')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showKeys.openprovider ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={state.openprovider.isSandbox}
                    onChange={(e) => handleUpdate('openprovider', 'isSandbox', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Use CTE Sandbox Environment</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => saveOne('openprovider')}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  <Save size={18} /> Save Openprovider Settings
                </button>
                <button
                  onClick={() => testConnection('openprovider')}
                  disabled={testing || saving}
                  className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70"
                >
                  {testing ? <RefreshCw size={18} className="animate-spin" /> : <Plug size={18} />} Test Connection
                </button>
              </div>
            </div>
          </div>

          {/* BTCL (.bd Registry) Settings */}
          <BtclSettingsCard />

        </div>
      </div>
    </div>
  );
}
