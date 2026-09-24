import React, { useState, useEffect } from 'react';
import {
  FileEdit, Folder, Package, PlusSquare, Tag, Server, Settings, Globe,
  Plus, Trash2, Edit2, CheckCircle2, Eye, EyeOff, Save
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc,
  serverTimestamp, query, orderBy, onSnapshot, limit
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Modal, StatusBadge, EmptyState, slugify } from '../components/SharedUI';

const REGISTRAR_DOC_PATH = ['hosting_config', 'registrar_settings'];

const defaultRegistrarState = {
  namecheap: { enabled: false, apiUsername: '', apiKey: '', clientIp: '' },
  resellerclub: { enabled: false, resellerId: '', apiKey: '' },
  enom: { enabled: false, loginId: '', apiPassword: '' }
};

export function DomainRegistrarsModule() {
  const [state, setState] = useState(defaultRegistrarState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({ namecheap: false, resellerclub: false, enom: false });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, REGISTRAR_DOC_PATH[0], REGISTRAR_DOC_PATH[1]));
        if (snap.exists()) {
          setState(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load registrar settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (registrar, field, value) => {
    setState(prev => ({
      ...prev,
      [registrar]: { ...prev[registrar], [field]: value },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, REGISTRAR_DOC_PATH[0], REGISTRAR_DOC_PATH[1]), state);
      toast.success('All registrar settings saved', { icon: '🌐' });
    } catch {
      toast.error('Failed to save registrar settings');
    } finally {
      setSaving(false);
    }
  };

  const saveOne = async (registrar) => {
    try {
      await setDoc(doc(db, REGISTRAR_DOC_PATH[0], REGISTRAR_DOC_PATH[1]), { [registrar]: state[registrar] }, { merge: true });
      toast.success(`${registrar.charAt(0).toUpperCase() + registrar.slice(1)} settings saved`);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const toggleShow = (registrar) => {
    setShowKeys(prev => ({ ...prev, [registrar]: !prev[registrar] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="text-center py-12 text-slate-500">Loading registrar settings...</div>
      </div>
    );
  }

  const registrars = [
    {
      key: 'namecheap',
      label: 'Namecheap',
      fields: [
        { key: 'apiUsername', label: 'API Username', type: 'text', placeholder: 'your_username' },
        { key: 'apiKey', label: 'API Key', type: showKeys.namecheap ? 'text' : 'password', placeholder: 'namecheap_api_key', isSecret: true },
        { key: 'clientIp', label: 'Whitelisted Client IP', type: 'text', placeholder: '1.2.3.4' },
      ],
    },
    {
      key: 'resellerclub',
      label: 'ResellerClub',
      fields: [
        { key: 'resellerId', label: 'Reseller ID', type: 'text', placeholder: 'your_reseller_id' },
        { key: 'apiKey', label: 'API Key', type: showKeys.resellerclub ? 'text' : 'password', placeholder: 'resellerclub_api_key', isSecret: true },
      ],
    },
    {
      key: 'enom',
      label: 'Enom',
      fields: [
        { key: 'loginId', label: 'Login ID', type: 'text', placeholder: 'your_login_id' },
        { key: 'apiPassword', label: 'API Password', type: showKeys.enom ? 'text' : 'password', placeholder: 'api_password', isSecret: true },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
        <Globe className="text-blue-500" /> Domain Registrars
      </h3>
      <p className="text-sm text-slate-500 mb-6">Configure the registrar APIs used to automatically register, transfer, and renew domains.</p>

      <div className="space-y-6">
        {registrars.map(reg => {
          const regState = state[reg.key] || {};
          return (
            <div key={reg.key} className={cn('border rounded-lg p-5', regState.enabled ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200 bg-gray-50')}>
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h4 className="font-bold text-slate-800 text-lg">{reg.label}</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, [reg.key]: !prev[reg.key] }))}
                    className="text-gray-400 hover:text-slate-600 text-xs flex items-center gap-1"
                    title={showKeys[reg.key] ? 'Hide keys' : 'Show keys'}
                  >
                    {showKeys[reg.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showKeys[reg.key] ? 'Hide' : 'Show'} Keys
                  </button>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={!!regState.enabled}
                        onChange={e => update(reg.key, 'enabled', e.target.checked)} />
                      <div className={cn('block w-10 h-6 rounded-full transition-colors', regState.enabled ? 'bg-blue-500' : 'bg-gray-300')} />
                      <div className={cn('dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform', regState.enabled ? 'translate-x-4' : '')} />
                    </div>
                  </label>
                </div>
              </div>

              {regState.enabled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reg.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={regState[field.key] || ''}
                          onChange={e => update(reg.key, field.key, e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => saveOne(reg.key)}
                    className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-700 transition-colors mt-2">
                    <Save size={14} /> Save {reg.label} Settings
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">This registrar module is currently disabled.</p>
              )}
            </div>
          );
        })}

        <div className="pt-4">
          <button onClick={saveAll} disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-sm hover:bg-blue-700 disabled:opacity-70 transition-colors flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Registrar Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}