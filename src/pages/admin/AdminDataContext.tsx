import React, { createContext, useContext, useState, ReactNode } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { AdminSharedState, AdminRefreshFunctions, AdminTab } from './types';

interface AdminDataContextType extends AdminSharedState, AdminRefreshFunctions {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const initialSharedState: AdminSharedState = {
  products: [],
  orders: [],
  customers: [],
  vendors: [],
  transactions: [],
  transactionCategories: [],
  menus: [],
  conveyances: [],
  users: [],
  campaigns: [],
  discountCodes: [],
  hostingPlans: [],
  hostingServices: [],
  employees: [],
  employeeLeaves: [],
  employeeSalaries: [],
  paymentAccounts: [],
  soldSerials: [],
  serviceRecords: [],
  loading: false,
};

export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sharedState, setSharedState] = useState<AdminSharedState>(initialSharedState);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const refreshAll = async () => {
    setSharedState(prev => ({ ...prev, loading: true }));
    try {
      const [productsSnap, ordersSnap, customersSnap, vendorsSnap, transactionsSnap, menusSnap, usersSnap, campaignsSnap, discountCodesSnap, hostingPlansSnap, hostingServicesSnap, soldSerialsSnap, serviceRecordsSnap, paymentAccountsSnap, transactionCategoriesSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'vendors'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'menus'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'couponCodes'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'hostingServices'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'sold_serials'), orderBy('soldAt', 'desc'))),
        getDocs(query(collection(db, 'service_records'), orderBy('receivedAt', 'desc'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'transaction_categories'), orderBy('createdAt', 'desc'))),
      ]);

      try {
        const [employeesSnap, employeeLeavesSnap, employeeSalariesSnap] = await Promise.all([
          getDocs(query(collection(db, 'employees'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'employee_leaves'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'employee_salaries'), orderBy('createdAt', 'desc'))),
        ]);

        setSharedState(prev => ({
          ...prev,
          products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          orders: ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          customers: customersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          vendors: vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          transactions: transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          menus: menusSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          users: usersSnap.docs.map(d => d.data()),
          campaigns: campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          discountCodes: discountCodesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          hostingPlans: hostingPlansSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          hostingServices: hostingServicesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          soldSerials: soldSerialsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          serviceRecords: serviceRecordsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          paymentAccounts: paymentAccountsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          transactionCategories: transactionCategoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          employees: employeesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          employeeLeaves: employeeLeavesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          employeeSalaries: employeeSalariesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          conveyances: prev.conveyances,
          loading: false,
        }));
      } catch (e) {
        setSharedState(prev => ({
          ...prev,
          products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          orders: ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          customers: customersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          vendors: vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          transactions: transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          menus: menusSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          users: usersSnap.docs.map(d => d.data()),
          campaigns: campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          discountCodes: discountCodesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          hostingPlans: hostingPlansSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          hostingServices: hostingServicesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          soldSerials: soldSerialsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          serviceRecords: serviceRecordsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          paymentAccounts: paymentAccountsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          transactionCategories: transactionCategoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error refreshing all data:', error);
      setSharedState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshProducts = async () => { /* TODO: implement */ };
  const refreshOrders = async () => { /* TODO: implement */ };
  const refreshCustomers = async () => { /* TODO: implement */ };
  const refreshVendors = async () => { /* TODO: implement */ };
  const refreshTransactions = async () => { /* TODO: implement */ };
  const refreshTransactionCategories = async () => { /* TODO: implement */ };
  const refreshMenus = async () => { /* TODO: implement */ };
  const refreshConveyances = async () => { /* TODO: implement */ };
  const refreshUsers = async () => { /* TODO: implement */ };
  const refreshCampaigns = async () => { /* TODO: implement */ };
  const refreshDiscountCodes = async () => { /* TODO: implement */ };
  const refreshHostingPlans = async () => { /* TODO: implement */ };
  const refreshHostingServices = async () => { /* TODO: implement */ };
  const refreshEmployees = async () => { /* TODO: implement */ };
  const refreshEmployeeLeaves = async () => { /* TODO: implement */ };
  const refreshEmployeeSalaries = async () => { /* TODO: implement */ };
  const refreshPaymentAccounts = async () => { /* TODO: implement */ };
  const refreshSoldSerials = async () => { /* TODO: implement */ };
  const refreshServiceRecords = async () => { /* TODO: implement */ };

  return (
    <AdminDataContext.Provider
      value={{
        ...sharedState,
        activeTab,
        setActiveTab,
        refreshProducts,
        refreshOrders,
        refreshCustomers,
        refreshVendors,
        refreshTransactions,
        refreshTransactionCategories,
        refreshMenus,
        refreshConveyances,
        refreshUsers,
        refreshCampaigns,
        refreshDiscountCodes,
        refreshHostingPlans,
        refreshHostingServices,
        refreshEmployees,
        refreshEmployeeLeaves,
        refreshEmployeeSalaries,
        refreshPaymentAccounts,
        refreshSoldSerials,
        refreshServiceRecords,
        refreshAll,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminData must be used within an AdminDataProvider');
  return context;
};
