import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee, UserProfile } from '../types';

/**
 * Automatically synchronizes staff and admin users with App Access
 * into the Employees collection and ensures all records are up to date.
 */
export async function syncAppAccessStaff(): Promise<Employee[]> {
  try {
    // 1. Fetch all portal users
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() } as unknown as UserProfile));

    // Filter only App Access staff / admins (exclude regular customers whose role is 'user')
    const staffUsers = allUsers.filter(u => {
      const role = (u.role || '').toLowerCase();
      const hasPerms = Array.isArray(u.permissions) && u.permissions.length > 0;
      return ['admin', 'manager', 'staff', 'technician', 'operator'].includes(role) || hasPerms;
    });

    // 2. Fetch existing employees
    const empSnap = await getDocs(collection(db, 'employees'));
    const existingEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));

    const updatedEmployeesList = [...existingEmployees];

    for (const u of staffUsers) {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uUid = u.uid || (u as any).id;
      const uName = u.displayName || u.email?.split('@')[0] || 'Staff Member';
      const uRole = (u.role && u.role !== 'user') 
        ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) 
        : 'Staff';

      // Find matching employee by userId or email
      const match = existingEmployees.find(e => 
        (e.userId && e.userId === uUid) || 
        (e.email && e.email.trim().toLowerCase() === uEmail)
      );

      if (!match) {
        // Create new employee
        const newEmpData: Omit<Employee, 'id'> = {
          name: uName,
          email: u.email || '',
          phone: (u as any).phone || (u as any).phoneNumber || '',
          role: uRole,
          baseSalary: 0,
          status: 'active',
          joinDate: (u.createdAt && !isNaN(new Date(u.createdAt).getTime()))
            ? new Date(u.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          userId: uUid,
          advanceBalance: 0,
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'employees'), newEmpData);
        updatedEmployeesList.push({ id: docRef.id, ...newEmpData } as Employee);
      } else {
        // Check if userId is missing or advanceBalance is undefined
        const updates: Partial<Employee> = {};
        if (!match.userId && uUid) {
          updates.userId = uUid;
        }
        if (match.advanceBalance === undefined) {
          updates.advanceBalance = 0;
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'employees', match.id), updates);
          const idx = updatedEmployeesList.findIndex(e => e.id === match.id);
          if (idx !== -1) {
            updatedEmployeesList[idx] = { ...updatedEmployeesList[idx], ...updates };
          }
        }
      }
    }

    return updatedEmployeesList;
  } catch (err) {
    console.error('Error syncing App Access staff to employees:', err);
    const empSnap = await getDocs(collection(db, 'employees'));
    return empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
  }
}
