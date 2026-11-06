import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee, UserProfile } from '../types';

function normalize(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Automatically deduplicates and cleans up existing duplicate employee documents
 * in Firestore, merges their data, and syncs App Access staff users.
 */
export async function syncAppAccessStaff(): Promise<Employee[]> {
  try {
    // 1. Fetch existing employees from Firestore
    const empSnap = await getDocs(collection(db, 'employees'));
    const allEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));

    // 2. Identify and cleanup duplicate employee documents in Firestore
    const cleanEmployeesMap = new Map<string, Employee>();
    const toDeleteIds: string[] = [];

    for (const emp of allEmployees) {
      const keyName = normalize(emp.name);
      const keyEmail = emp.email ? normalize(emp.email) : '';
      const keyUser = emp.userId || '';

      // Check if this employee matches an already registered master record
      let existingMaster: Employee | undefined;
      for (const master of cleanEmployeesMap.values()) {
        const mName = normalize(master.name);
        const mEmail = master.email ? normalize(master.email) : '';
        const mUser = master.userId || '';

        if (
          (keyUser && mUser && keyUser === mUser) ||
          (keyEmail && mEmail && keyEmail === mEmail) ||
          (keyName && mName && keyName === mName)
        ) {
          existingMaster = master;
          break;
        }
      }

      if (existingMaster) {
        // Mark duplicate for deletion from Firestore
        toDeleteIds.push(emp.id);

        // Merge any valuable data into existingMaster
        const updates: Partial<Employee> = {};
        if (!existingMaster.userId && emp.userId) {
          existingMaster.userId = emp.userId;
          updates.userId = emp.userId;
        }
        if (!existingMaster.email && emp.email) {
          existingMaster.email = emp.email;
          updates.email = emp.email;
        }
        if (!existingMaster.phone && emp.phone) {
          existingMaster.phone = emp.phone;
          updates.phone = emp.phone;
        }
        if ((!existingMaster.baseSalary || existingMaster.baseSalary === 0) && (emp.baseSalary && emp.baseSalary > 0)) {
          existingMaster.baseSalary = emp.baseSalary;
          updates.baseSalary = emp.baseSalary;
        }
        if ((!existingMaster.advanceBalance || existingMaster.advanceBalance === 0) && (emp.advanceBalance && emp.advanceBalance > 0)) {
          existingMaster.advanceBalance = emp.advanceBalance;
          updates.advanceBalance = emp.advanceBalance;
        }
        if (emp.salaryHike && !existingMaster.salaryHike) {
          existingMaster.salaryHike = emp.salaryHike;
          existingMaster.previousSalary = emp.previousSalary;
          updates.salaryHike = emp.salaryHike;
          updates.previousSalary = emp.previousSalary;
        }
        if (emp.salaryHistory && (!existingMaster.salaryHistory || existingMaster.salaryHistory.length === 0)) {
          existingMaster.salaryHistory = emp.salaryHistory;
          updates.salaryHistory = emp.salaryHistory;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'employees', existingMaster.id), updates).catch(console.error);
        }
      } else {
        cleanEmployeesMap.set(emp.id, emp);
      }
    }

    // Safely delete duplicate docs from Firestore
    if (toDeleteIds.length > 0) {
      await Promise.allSettled(toDeleteIds.map(id => deleteDoc(doc(db, 'employees', id))));
      console.log(`Deduplicated and removed ${toDeleteIds.length} duplicate employee records from Firestore`);
    }

    let currentEmployees = Array.from(cleanEmployeesMap.values());

    // 3. Fetch App Access staff/admin users
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() } as unknown as UserProfile));

    const staffUsers = allUsers.filter(u => {
      const role = (u.role || '').toLowerCase();
      const hasPerms = Array.isArray(u.permissions) && u.permissions.length > 0;
      return ['admin', 'manager', 'staff', 'technician', 'operator'].includes(role) || hasPerms;
    });

    // 4. Sync App Access staff with current employees (matching by userId, email, or normalized name!)
    for (const u of staffUsers) {
      const uEmail = normalize(u.email);
      const uUid = u.uid || (u as any).id;
      const uName = (u.displayName || u.email?.split('@')[0] || 'Staff Member').trim();
      const uNormName = normalize(uName);
      const uRole = (u.role && u.role !== 'user') 
        ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) 
        : 'Staff';

      // Match by userId, email, or normalized name
      const match = currentEmployees.find(e => 
        (e.userId && e.userId === uUid) || 
        (uEmail && e.email && normalize(e.email) === uEmail) ||
        (uNormName && normalize(e.name) === uNormName)
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
        currentEmployees.push({ id: docRef.id, ...newEmpData } as Employee);
      } else {
        // Update userId or fields if missing
        const updates: Partial<Employee> = {};
        if (!match.userId && uUid) {
          match.userId = uUid;
          updates.userId = uUid;
        }
        if (!match.email && u.email) {
          match.email = u.email;
          updates.email = u.email;
        }
        if (match.advanceBalance === undefined) {
          match.advanceBalance = 0;
          updates.advanceBalance = 0;
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'employees', match.id), updates).catch(console.error);
        }
      }
    }

    // Final in-memory deduplication check
    const finalMap = new Map<string, Employee>();
    for (const e of currentEmployees) {
      const key = normalize(e.name);
      if (!finalMap.has(key)) {
        finalMap.set(key, e);
      }
    }

    return Array.from(finalMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    console.error('Error in syncAppAccessStaff:', err);
    const empSnap = await getDocs(collection(db, 'employees'));
    return empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
  }
}
