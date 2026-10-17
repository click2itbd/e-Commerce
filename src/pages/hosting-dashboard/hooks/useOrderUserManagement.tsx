import { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { logAudit } from '../../../lib/audit';

export function useOrderUserManagement(orders, setOrders, users, setUsers) {
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderStatusEdits, setOrderStatusEdits] = useState({});
  const [savingOrderStatus, setSavingOrderStatus] = useState({});

  const [userSearch, setUserSearch] = useState('');
  const [userRoleEdits, setUserRoleEdits] = useState({});
  const [savingUserRole, setSavingUserRole] = useState({});

  const ITEMS_PER_PAGE = 15;

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter(o => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const orderPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const pagedOrders = filteredOrders.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE);

  const saveOrderStatus = async (id) => {
    const newStatus = orderStatusEdits[id];
    if (!newStatus) return;
    setSavingOrderStatus(prev => ({ ...prev, [id]: true }));
    try {
      const targetOrder = orders.find(o => o.id === id);
      const oldStatus = targetOrder?.status || 'pending';
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      await logAudit(
        'STATUS_CHANGE',
        'Order',
        `Changed status of Order #${targetOrder?.documentNumber || id.slice(0, 8)} from "${oldStatus}" to "${newStatus}"`,
        auth.currentUser?.email || 'Admin',
        {
          entityId: id,
          previousState: { status: oldStatus },
          newState: { status: newStatus },
        }
      );
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setSavingOrderStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      (u.displayName || u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const saveUserRole = async (id) => {
    const newRole = userRoleEdits[id];
    if (!newRole) return;
    setSavingUserRole(prev => ({ ...prev, [id]: true }));
    try {
      const targetUser = users.find(u => u.id === id || u.uid === id);
      const oldRole = targetUser?.role || 'user';
      await updateDoc(doc(db, 'users', id), { role: newRole });
      await logAudit(
        'ROLE_CHANGE',
        'User',
        `Changed role of "${targetUser?.displayName || targetUser?.email || id}" (${targetUser?.email || id}) from "${oldRole}" to "${newRole}"`,
        auth.currentUser?.email || 'Admin',
        {
          entityId: id,
          previousState: { role: oldRole },
          newState: { role: newRole },
        }
      );
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast.success('User role updated');
    } catch {
      toast.error('Failed to update user role');
    } finally {
      setSavingUserRole(prev => ({ ...prev, [id]: false }));
    }
  };

  return {
    orderPage, setOrderPage,
    orderStatusFilter, setOrderStatusFilter,
    orderStatusEdits, setOrderStatusEdits,
    savingOrderStatus,
    saveOrderStatus,
    orderPages,
    pagedOrders,
    filteredOrders,

    userSearch, setUserSearch,
    userRoleEdits, setUserRoleEdits,
    savingUserRole,
    saveUserRole,
    filteredUsers
  };
}
