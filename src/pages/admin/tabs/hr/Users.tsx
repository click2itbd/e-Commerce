import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db, firebaseConfig } from '../../../../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserProfile, UserPermission } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Users as UsersIcon, Mail, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Pagination } from '../../../../components/common/Pagination';

const UsersTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserPermissions, setEditingUserPermissions] = useState<any | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'user', permissions: [] as UserPermission[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserProfile));
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      let permissions: UserPermission[] = [];
      if (newRole === 'admin') permissions = ['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'];
      else if (newRole === 'manager') permissions = ['view_dashboard', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports'];
      else if (newRole === 'staff') permissions = ['view_dashboard', 'manage_inventory', 'manage_orders'];
      
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        permissions
      });
      toast.success('User role and permissions updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleAddPortalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, userFormData.email, userFormData.password);
      
      await doc(db, 'users', userCred.user.uid);
      
      await secondaryAuth.signOut();
      
      toast.success('User added successfully');
      setIsAddingUser(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error adding user: ' + err.message);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UsersIcon className="text-[#EF4444]" /> User Management
        </h2>
        <button onClick={() => {
          setUserFormData({ name: '', email: '', password: '', role: 'user', permissions: [] });
          setIsAddingUser(true);
        }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
           + Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(user => (
              <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{user.displayName || 'No Name'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                    <Mail size={12} /> {user.email}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)}
                     className="text-xs border-gray-200 rounded-md focus:ring-[#EF4444]"
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    onClick={() => {
                      setEditingUserPermissions(user);
                      setShowPermissionsModal(true);
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                  >
                    Permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={users.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {showPermissionsModal && editingUserPermissions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="font-bold text-lg mb-4">Edit Permissions for {editingUserPermissions.displayName}</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'].map(perm => {
                 const hasPermission = (editingUserPermissions.permissions || []).includes(perm);
                 return (
                  <label key={perm} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={hasPermission} onChange={() => {
                      const newPermissions = hasPermission
                        ? (editingUserPermissions.permissions || []).filter((p: string) => p !== perm)
                        : [...(editingUserPermissions.permissions || []), perm];
                      setEditingUserPermissions({...editingUserPermissions, permissions: newPermissions});
                    }} className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]" />
                    {perm.replace('manage_', '').replace('view_', '')}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={async () => {
                await updateDoc(doc(db, 'users', editingUserPermissions.uid), { permissions: editingUserPermissions.permissions });
                toast.success('Permissions updated');
                setShowPermissionsModal(false);
                fetchData();
              }} className="px-4 py-2 bg-[#EF4444] text-white rounded text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {isAddingUser && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">New Portal User</h2>
              <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPortalUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input type="text" required className="w-full border-gray-300 rounded-md" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full border-gray-300 rounded-md" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" required minLength={6} className="w-full border-gray-300 rounded-md" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select className="w-full border-gray-300 rounded-md" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(userFormData.role === 'manager' || userFormData.role === 'staff') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'].map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={userFormData.permissions.includes(perm as UserPermission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({ ...userFormData, permissions: [...userFormData.permissions, perm as UserPermission] });
                            } else {
                              setUserFormData({ ...userFormData, permissions: userFormData.permissions.filter(p => p !== perm) });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{perm.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
