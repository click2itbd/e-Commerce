import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Order } from '../../../../types';
import {
  Trophy,
  TrendingUp,
  Package,
  Wrench,
  Calendar,
  Award,
  DollarSign,
  Target,
  CheckCircle2,
  FileText,
  CheckSquare,
  Users,
  Star,
  ArrowUpRight,
  Eye,
  Download,
  Printer,
  Search,
  Zap,
  Sparkles,
  Percent,
  X,
  Phone,
  Mail,
  Shield,
  Layers
} from 'lucide-react';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useSettings } from '../../../../context/SettingsContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StaffPerformanceProps {
  orders: Order[];
}

export interface StaffPerformanceRecord {
  key: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  status: string;

  // Sales
  totalSales: number;
  totalSalesRevenue: number;
  averageOrderValue: number;
  highestSale: number;
  salesOrders: any[];

  // Services
  totalServicesReceived: number;
  totalServicesDelivered: number;
  totalServiceRevenue: number;
  serviceTickets: any[];

  // Quotations
  totalQuotations: number;
  wonQuotations: number;
  quotationWinRate: number;
  totalQuotationValue: number;
  quotationList: any[];

  // Tasks
  totalTasksAssigned: number;
  tasksCompleted: number;
  taskCompletionRate: number;

  // References
  referenceSalesCount: number;

  // Combined
  totalRevenue: number;
  performanceScore: number;
  performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export const StaffPerformanceTab: React.FC<StaffPerformanceProps> = ({ orders }) => {
  const { settings } = useSettings();
  const [services, setServices] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'sales' | 'services' | 'quotations' | 'tasks'>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformanceRecord | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(1.0); // 1% commission calculator

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [servicesSnap, tasksSnap, empSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'services'), limit(1500))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'tasks'), limit(1000))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'employees'), limit(500))).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'users'), limit(500))).catch(() => ({ docs: [] }))
        ]);

        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEmployees(empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching staff performance dependencies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const stripPrefix = (str: string) => {
    return (str || '')
      .toLowerCase()
      .replace(/^md\.?\s+/i, '')
      .replace(/^mohammad\s+/i, '')
      .replace(/^mohammed\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const resolveStaffName = (raw: string): string => {
    if (!raw) return 'System Admin';
    const clean = raw.trim();

    if (clean === 'Admin' || clean === 'Admin / Unknown' || clean.toLowerCase() === 'system admin') {
      return 'System Admin';
    }

    // 1. Check if clean matches a user by UID, id or email
    const matchedUser = users.find(u => 
      u.uid === clean || 
      (u as any)?.id === clean || 
      u.email?.toLowerCase() === clean.toLowerCase()
    );
    if (matchedUser) {
      const uName = matchedUser.displayName || (matchedUser as any)?.name || matchedUser.email;
      if (uName) return uName.trim();
    }

    // 2. Check if clean matches an employee by UID, id, or email
    const matchedEmp = employees.find(e => 
      (e as any)?.uid === clean || 
      e.id === clean || 
      e.email?.toLowerCase() === clean.toLowerCase()
    );
    if (matchedEmp && matchedEmp.name) {
      return matchedEmp.name.trim();
    }

    // 3. If clean is a raw Firebase UID string (length >= 20, no spaces, no @) that wasn't found:
    if (/^[a-zA-Z0-9_-]{20,}$/.test(clean)) {
      return ''; // Discard unknown raw UID so it doesn't create a ghost staff row
    }

    return clean;
  };

  // Helper: Normalize staff names to prevent duplicate rows for the same person
  const normalizeStaffKey = (raw: string): string => {
    const resolved = resolveStaffName(raw);
    if (!resolved) return '';

    const clean = resolved.trim().replace(/\s+/g, ' ');
    if (clean.toLowerCase() === 'admin' || clean.toLowerCase() === 'admin / unknown' || clean.toLowerCase() === 'system admin') {
      return 'system admin';
    }

    const stripped = stripPrefix(clean);

    // Look for matching employee by stripped name
    const matchedEmp = employees.find(e => stripPrefix(e.name || '') === stripped);
    if (matchedEmp && matchedEmp.name) {
      return stripPrefix(matchedEmp.name);
    }

    // Look for matching user by stripped name
    const matchedUser = users.find(u => stripPrefix(u.displayName || (u as any)?.name || '') === stripped);
    if (matchedUser) {
      const uName = matchedUser.displayName || (matchedUser as any)?.name;
      if (uName) return stripPrefix(uName);
    }

    return stripped;
  };

  const getStaffDetails = (key: string, fallbackName: string) => {
    if (key === 'system admin') {
      return {
        displayName: 'System Admin',
        email: '',
        phone: '',
        role: 'Admin / Direct POS',
        avatar: '',
        status: 'active'
      };
    }

    const emp = employees.find(e =>
      stripPrefix(e.name || '') === key ||
      e.email?.trim().toLowerCase() === key ||
      e.id === key
    );
    const usr = users.find(u =>
      stripPrefix(u.displayName || (u as any)?.name || '') === key ||
      u.email?.trim().toLowerCase() === key ||
      u.uid === key ||
      (u as any)?.id === key
    );

    return {
      displayName: emp?.name || usr?.displayName || (usr as any)?.name || fallbackName,
      email: emp?.email || usr?.email || '',
      phone: emp?.phone || '',
      role: emp?.role || usr?.role || 'Staff Member',
      avatar: usr?.photoURL || emp?.nidUrl || '',
      status: emp?.status || 'active'
    };
  };

  // Date Filtering Calculation
  const { filteredOrders, filteredServices, filteredTasks } = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date(2100, 0, 1);

    if (dateFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day;
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (dateFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilter === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateFilter === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const fOrders = orders.filter(o => {
      const createdAt = o.createdAt || new Date(0).toISOString();
      return createdAt >= startIso && createdAt <= endIso;
    });

    const fServices = services.filter(s => {
      const sDate = s.receivedAt || s.createdAt || new Date(0).toISOString();
      return sDate >= startIso && sDate <= endIso;
    });

    const fTasks = tasks.filter(t => {
      const tDate = t.createdAt || new Date(0).toISOString();
      return tDate >= startIso && tDate <= endIso;
    });

    return { filteredOrders: fOrders, filteredServices: fServices, filteredTasks: fTasks };
  }, [orders, services, tasks, dateFilter]);

  // Aggregation & Performance Scoring
  const { stats, totals } = useMemo(() => {
    const staffMap: Record<string, StaffPerformanceRecord> = {};

    let totalSystemSalesRevenue = 0;
    let totalSystemSalesCount = 0;
    let totalSystemServiceRevenue = 0;
    let totalSystemServicesCount = 0;
    let totalSystemQuotationsCount = 0;
    let totalSystemWonQuotations = 0;

    // Helper to ensure staff record initialized
    const ensureStaff = (rawName: string): StaffPerformanceRecord | null => {
      const key = normalizeStaffKey(rawName);
      if (!key) return null;
      if (!staffMap[key]) {
        const details = getStaffDetails(key, rawName.trim() || 'System Admin');
        staffMap[key] = {
          key,
          name: details.displayName,
          displayName: details.displayName,
          email: details.email,
          phone: details.phone,
          role: details.role,
          avatar: details.avatar,
          status: details.status,

          totalSales: 0,
          totalSalesRevenue: 0,
          averageOrderValue: 0,
          highestSale: 0,
          salesOrders: [],

          totalServicesReceived: 0,
          totalServicesDelivered: 0,
          totalServiceRevenue: 0,
          serviceTickets: [],

          totalQuotations: 0,
          wonQuotations: 0,
          quotationWinRate: 0,
          totalQuotationValue: 0,
          quotationList: [],

          totalTasksAssigned: 0,
          tasksCompleted: 0,
          taskCompletionRate: 0,

          referenceSalesCount: 0,

          totalRevenue: 0,
          performanceScore: 0,
          performanceGrade: 'C'
        };
      }
      return staffMap[key];
    };

    // 1. Process Orders (Sales & Quotations)
    filteredOrders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'returned') return;

      const rawStaffName = o.preparedBy || o.createdBy || 'System Admin';
      const staff = ensureStaff(rawStaffName);
      if (!staff) return;

      // Check if this is a quotation
      if (o.type === 'quotation') {
        staff.totalQuotations += 1;
        totalSystemQuotationsCount += 1;
        const qVal = Number(o.total || o.subtotal || 0);
        staff.totalQuotationValue += qVal;
        staff.quotationList.push(o);

        if (o.status === 'accepted' || o.status === 'invoiced') {
          staff.wonQuotations += 1;
          totalSystemWonQuotations += 1;
        }
      } else {
        // Regular Sale Invoice / POS
        staff.totalSales += 1;
        totalSystemSalesCount += 1;

        const rev = Number(o.total) || 0;
        staff.totalSalesRevenue += rev;
        totalSystemSalesRevenue += rev;

        if (rev > staff.highestSale) {
          staff.highestSale = rev;
        }
        staff.salesOrders.push(o);

        if (o.hasReference || (o.referrerName && o.referrerName.trim() !== '')) {
          staff.referenceSalesCount += 1;
        }
      }
    });

    // 2. Process Services
    filteredServices.forEach(s => {
      if (s.status === 'cancelled') return;

      const rawStaffName = s.preparedBy || s.receivedBy || 'System Admin';
      const staff = ensureStaff(rawStaffName);
      if (!staff) return;

      staff.totalServicesReceived += 1;
      totalSystemServicesCount += 1;

      if (s.status === 'delivered') {
        staff.totalServicesDelivered += 1;
      }

      const charge = Number(s.serviceCharge) || 0;
      staff.totalServiceRevenue += charge;
      totalSystemServiceRevenue += charge;
      staff.serviceTickets.push(s);

      if (s.hasReference || (s.referrerName && s.referrerName.trim() !== '')) {
        staff.referenceSalesCount += 1;
      }
    });

    // 3. Process Tasks
    filteredTasks.forEach(t => {
      const rawStaffName = t.assignedTo || t.userName || t.assignedBy || '';
      if (!rawStaffName) return;

      const staff = ensureStaff(rawStaffName);
      if (!staff) return;

      staff.totalTasksAssigned += 1;

      if (t.status === 'completed') {
        staff.tasksCompleted += 1;
      }
    });

    // 4. Calculate Final Composite Metrics & Performance Scores
    const staffList = Object.values(staffMap);

    // Compute max values for benchmarking
    const maxRevenue = Math.max(...staffList.map(s => s.totalSalesRevenue + s.totalServiceRevenue), 1);
    const maxSales = Math.max(...staffList.map(s => s.totalSales), 1);
    const maxServices = Math.max(...staffList.map(s => s.totalServicesReceived), 1);

    staffList.forEach(s => {
      s.totalRevenue = s.totalSalesRevenue + s.totalServiceRevenue;
      s.averageOrderValue = s.totalSales > 0 ? Math.round(s.totalSalesRevenue / s.totalSales) : 0;
      s.quotationWinRate = s.totalQuotations > 0 ? Math.round((s.wonQuotations / s.totalQuotations) * 100) : 0;
      s.taskCompletionRate = s.totalTasksAssigned > 0 ? Math.round((s.tasksCompleted / s.totalTasksAssigned) * 100) : 0;

      // Intelligent Weighted Score (0 to 100):
      // - Revenue Factor: 40%
      // - Sales Volume Factor: 25%
      // - Service Performance: 15%
      // - Quotation & Deals: 10%
      // - Task & Customer Reference: 10%
      const revenueScore = (s.totalRevenue / maxRevenue) * 40;
      const salesScore = (s.totalSales / maxSales) * 25;
      const serviceScore = maxServices > 0 ? (s.totalServicesReceived / maxServices) * 15 : 0;
      const quoteScore = s.wonQuotations > 0 ? Math.min(10, s.wonQuotations * 3) : 0;
      const taskRefScore = Math.min(10, (s.tasksCompleted * 2) + (s.referenceSalesCount * 2));

      let score = Math.round(revenueScore + salesScore + serviceScore + quoteScore + taskRefScore);
      if (s.totalSales > 0 && score < 20) score = 25; // Base recognition for active sales
      s.performanceScore = Math.min(100, Math.max(0, score));

      if (s.performanceScore >= 85) s.performanceGrade = 'A+';
      else if (s.performanceScore >= 70) s.performanceGrade = 'A';
      else if (s.performanceScore >= 55) s.performanceGrade = 'B';
      else if (s.performanceScore >= 40) s.performanceGrade = 'C';
      else s.performanceGrade = 'D';
    });

    // Sort by Total Revenue descending, only showing real staff with activities
    const sortedStats = staffList
      .filter(s => 
        (s.totalSales > 0 || s.totalServicesReceived > 0 || s.totalQuotations > 0 || s.tasksCompleted > 0) &&
        s.key !== '' &&
        !/^[a-zA-Z0-9_-]{20,}$/.test(s.displayName)
      )
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      stats: sortedStats,
      totals: {
        totalRevenue: totalSystemSalesRevenue + totalSystemServiceRevenue,
        salesRevenue: totalSystemSalesRevenue,
        serviceRevenue: totalSystemServiceRevenue,
        salesCount: totalSystemSalesCount,
        servicesCount: totalSystemServicesCount,
        quotationsCount: totalSystemQuotationsCount,
        wonQuotations: totalSystemWonQuotations,
        topSeller: sortedStats.length > 0 ? sortedStats[0] : null,
        averageAov: totalSystemSalesCount > 0 ? Math.round(totalSystemSalesRevenue / totalSystemSalesCount) : 0
      }
    };
  }, [filteredOrders, filteredServices, filteredTasks, employees, users]);

  // Filtered staff list based on search and category
  const displayedStaff = useMemo(() => {
    return stats.filter(s => {
      const matchSearch =
        s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeCategory === 'sales') return s.totalSales > 0;
      if (activeCategory === 'services') return s.totalServicesReceived > 0;
      if (activeCategory === 'quotations') return s.totalQuotations > 0;
      if (activeCategory === 'tasks') return s.totalTasksAssigned > 0 || s.referenceSalesCount > 0;

      return true;
    });
  }, [stats, searchQuery, activeCategory]);

  // PDF Export of Staff Performance Leaderboard
  const exportPerformancePdf = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.brandName || 'CLICK2IT BD', 14, 18);

      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('Staff Multi-Criteria Performance & Evaluation Report', 14, 26);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${dateFilter.replace('_', ' ').toUpperCase()} • Generated: ${new Date().toLocaleString()}`, 14, 32);

      const tableData = displayedStaff.map((staff, idx) => [
        `#${idx + 1}`,
        staff.displayName,
        staff.role || 'Staff',
        `${staff.performanceScore}/100 (${staff.performanceGrade})`,
        `${staff.totalSales} orders`,
        `৳${staff.averageOrderValue.toLocaleString()}`,
        `${staff.totalServicesReceived} recv / ${staff.totalServicesDelivered} done`,
        `${staff.totalQuotations} quotes (${staff.wonQuotations} won)`,
        `${staff.tasksCompleted}/${staff.totalTasksAssigned} tasks`,
        `৳${staff.totalRevenue.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 38,
        head: [['Rank', 'Staff Name', 'Role', 'KPI Score', 'Sales', 'Avg Order (AOV)', 'Services', 'Quotations', 'Tasks', 'Total Revenue']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 25;
      if (finalY < 190) {
        doc.setLineWidth(0.3);
        doc.line(14, finalY, 70, finalY);
        doc.text('Prepared By (HR/Admin)', 14, finalY + 5);

        doc.line(pageWidth - 70, finalY, pageWidth - 14, finalY);
        doc.text('Managing Director / CEO', pageWidth - 14, finalY + 5, { align: 'right' });
      }

      doc.save(`Staff_Performance_Report_${dateFilter}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-100 shadow-sm max-w-6xl mx-auto flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
        <span>Loading comprehensive staff performance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER & PERIOD SWITCHER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                Staff Performance & KPI Evaluation
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Multi-dimensional performance tracking across Sales, Servicing, Quotations, Tasks & Revenue.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Period Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 pr-2 focus:ring-0 cursor-pointer"
            >
              <option value="today">Today (আজকে)</option>
              <option value="this_week">This Week (এই সপ্তাহ)</option>
              <option value="this_month">This Month (চলতি মাস)</option>
              <option value="last_month">Last Month (গত মাস)</option>
              <option value="this_year">This Year (চলতি বছর)</option>
              <option value="all">All Time (সর্বকাল)</option>
            </select>
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={exportPerformancePdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Download / Print PDF Report"
          >
            <Printer size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── 5-METRIC EXECUTIVE SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Total Revenue</span>
              <DollarSign size={16} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black">{formatCurrency(totals.totalRevenue, settings)}</h3>
          </div>
          <div className="mt-3 text-[10px] text-teal-100 font-medium">
            <span>Sales: {formatCurrency(totals.salesRevenue, settings)}</span>
            {totals.serviceRevenue > 0 && <span className="block mt-0.5">• Service: {formatCurrency(totals.serviceRevenue, settings)}</span>}
          </div>
        </div>

        {/* Sales Orders & AOV */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Sales Made</span>
              <Package size={16} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black">{totals.salesCount} Orders</h3>
          </div>
          <p className="mt-3 text-[10px] text-blue-100 font-medium">
            Avg. Order Value: <strong className="font-bold">৳{totals.averageAov.toLocaleString()}</strong>
          </p>
        </div>

        {/* Services & Repairs */}
        <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Services Handled</span>
              <Wrench size={16} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black">{totals.servicesCount} Tickets</h3>
          </div>
          <p className="mt-3 text-[10px] text-purple-100 font-medium">
            Service Fees: <strong>{formatCurrency(totals.serviceRevenue, settings)}</strong>
          </p>
        </div>

        {/* Quotations & Deal Win Rate */}
        <div className="bg-gradient-to-br from-cyan-600 to-sky-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Quotes & Deals</span>
              <FileText size={16} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black">{totals.quotationsCount} Quotes</h3>
          </div>
          <p className="mt-3 text-[10px] text-sky-100 font-medium">
            {totals.wonQuotations} Won ({totals.quotationsCount > 0 ? Math.round((totals.wonQuotations / totals.quotationsCount) * 100) : 0}% Conversion)
          </p>
        </div>

        {/* Top Performer Star Employee */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Top Performer</span>
              <Award size={18} />
            </div>
            <h3 className="text-lg sm:text-xl font-black truncate">{totals.topSeller?.displayName || 'N/A'}</h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-amber-100 font-bold">
            <span>Score: {totals.topSeller?.performanceScore || 0}/100</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full">{totals.topSeller?.performanceGrade || 'A+'}</span>
          </div>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Metric Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {[
            { id: 'all', label: 'All Criteria (সার্বিক সূচক)', icon: Sparkles },
            { id: 'sales', label: 'Sales & Revenue', icon: Package },
            { id: 'services', label: 'Warranty & Services', icon: Wrench },
            { id: 'quotations', label: 'Quotations', icon: FileText },
            { id: 'tasks', label: 'Tasks & References', icon: CheckSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                )}
              >
                <Icon size={13} className={active ? "text-amber-400" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-0"
          />
        </div>
      </div>

      {/* ── LEADERBOARD TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">KPI Score</th>
                <th className="px-5 py-3.5">Sales (Orders & AOV)</th>
                <th className="px-5 py-3.5">Services Handled</th>
                <th className="px-5 py-3.5">Quotes & Win Rate</th>
                <th className="px-5 py-3.5">Tasks & Ref.</th>
                <th className="px-5 py-3.5 text-right">Total Revenue Gen.</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No staff records found for the selected filter or search query.
                  </td>
                </tr>
              ) : (
                displayedStaff.map((staff, idx) => {
                  const isTop = idx === 0;
                  return (
                    <tr
                      key={staff.key}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors group cursor-pointer",
                        isTop ? "bg-amber-50/20" : ""
                      )}
                      onClick={() => setSelectedStaff(staff)}
                    >
                      {/* Rank */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {idx === 0 ? (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black shadow-xs border border-amber-300">
                            <Trophy size={14} className="fill-current text-amber-500" />
                          </div>
                        ) : idx === 1 ? (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black border border-slate-300">
                            2
                          </div>
                        ) : idx === 2 ? (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-800 font-black border border-orange-300">
                            3
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 font-bold">
                            {idx + 1}
                          </div>
                        )}
                      </td>

                      {/* Staff Member */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs",
                            idx === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-600" :
                            idx === 1 ? "bg-gradient-to-br from-slate-500 to-slate-700" :
                            idx === 2 ? "bg-gradient-to-br from-orange-500 to-amber-700" :
                            "bg-gradient-to-br from-blue-500 to-indigo-600"
                          )}>
                            {staff.avatar ? (
                              <img src={staff.avatar} alt={staff.displayName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              staff.displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{staff.displayName}</span>
                              {isTop && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-black uppercase">
                                  Top
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {staff.role} {staff.phone && `• ${staff.phone}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Performance Score & Grade */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-800">{staff.performanceScore}/100</span>
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded",
                              staff.performanceGrade === 'A+' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              staff.performanceGrade === 'A' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                              staff.performanceGrade === 'B' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                              "bg-slate-100 text-slate-700 border border-slate-200"
                            )}>
                              Grade {staff.performanceGrade}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                staff.performanceGrade === 'A+' ? "bg-amber-500" :
                                staff.performanceGrade === 'A' ? "bg-emerald-500" :
                                staff.performanceGrade === 'B' ? "bg-blue-500" : "bg-slate-400"
                              )}
                              style={{ width: `${staff.performanceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Sales & AOV */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {staff.totalSales} <span className="text-[10px] font-normal text-slate-500">Orders</span>
                          </div>
                          {staff.totalSales > 0 ? (
                            <div className="text-[10px] text-slate-500">
                              Avg: <strong className="text-slate-800">৳{staff.averageOrderValue.toLocaleString()}</strong>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No sales</span>
                          )}
                        </div>
                      </td>

                      {/* Services */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-bold text-slate-800">
                            {staff.totalServicesReceived} <span className="text-[10px] font-normal text-slate-500">Tickets</span>
                          </div>
                          {staff.totalServicesReceived > 0 ? (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              ✓ {staff.totalServicesDelivered} delivered
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No tickets</span>
                          )}
                        </div>
                      </td>

                      {/* Quotations & Win Rate */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-bold text-slate-800">
                            {staff.totalQuotations} <span className="text-[10px] font-normal text-slate-500">Quotes</span>
                          </div>
                          {staff.totalQuotations > 0 ? (
                            <span className="text-[10px] text-cyan-700 font-medium">
                              {staff.wonQuotations} won ({staff.quotationWinRate}%)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No quotes</span>
                          )}
                        </div>
                      </td>

                      {/* Tasks & References */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-700">
                            {staff.tasksCompleted} / {staff.totalTasksAssigned} Tasks
                          </div>
                          {staff.referenceSalesCount > 0 && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                              🤝 {staff.referenceSalesCount} Ref. Sales
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Revenue */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div>
                          <span className="font-black text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            {formatCurrency(staff.totalRevenue, settings)}
                          </span>
                          {staff.totalServiceRevenue > 0 && (
                            <div className="text-[9px] text-slate-400 font-medium mt-1">
                              Incl. {formatCurrency(staff.totalServiceRevenue, settings)} (Svc)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaff(staff);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="View 360° Staff Performance Breakdown"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 360° STAFF PERFORMANCE MODAL ── */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md border border-white/20">
                  {selectedStaff.avatar ? (
                    <img src={selectedStaff.avatar} alt={selectedStaff.displayName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    selectedStaff.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedStaff.displayName}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                      Score: {selectedStaff.performanceScore}/100 ({selectedStaff.performanceGrade})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedStaff.role} {selectedStaff.email && `• ${selectedStaff.email}`} {selectedStaff.phone && `• 📞 ${selectedStaff.phone}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Detailed KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Revenue</span>
                  <strong className="text-base font-black text-emerald-950">{formatCurrency(selectedStaff.totalRevenue, settings)}</strong>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Sales + Service fees</span>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Sales Volume & AOV</span>
                  <strong className="text-base font-black text-blue-950">{selectedStaff.totalSales} Orders</strong>
                  <span className="text-[9px] text-blue-700 block mt-0.5">Avg: ৳{selectedStaff.averageOrderValue.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Service Tickets</span>
                  <strong className="text-base font-black text-purple-950">{selectedStaff.totalServicesReceived} Recv.</strong>
                  <span className="text-[9px] text-purple-700 block mt-0.5">✓ {selectedStaff.totalServicesDelivered} Delivered</span>
                </div>

                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
                  <span className="text-[10px] font-bold text-cyan-800 uppercase block">Quotes Converted</span>
                  <strong className="text-base font-black text-cyan-950">{selectedStaff.wonQuotations} / {selectedStaff.totalQuotations}</strong>
                  <span className="text-[9px] text-cyan-700 block mt-0.5">{selectedStaff.quotationWinRate}% Win Rate</span>
                </div>
              </div>

              {/* Commission / Incentive Calculator Box */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Incentive & Sales Commission Estimation</span>
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Calculate performance-based commission for {selectedStaff.displayName}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-amber-300">
                    <span className="text-xs font-bold text-slate-500 mr-1">%</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                      className="w-12 text-xs font-black text-slate-900 border-none p-0 outline-none focus:ring-0"
                    />
                  </div>
                  <div className="px-3 py-1 bg-amber-500 text-white font-black text-xs rounded-lg shadow-2xs">
                    ৳{Math.round((selectedStaff.totalSalesRevenue * commissionRate) / 100).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Recent Sales Handled by this Staff */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                  Recent Sales Invoices Handled ({selectedStaff.salesOrders.length})
                </span>
                {selectedStaff.salesOrders.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-lg">No sales orders handled in this period.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {selectedStaff.salesOrders.slice(0, 10).map((o: any) => (
                      <div key={o.id} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between transition-colors">
                        <div>
                          <strong className="text-slate-900 font-bold block">{o.customerName || 'Walk-in Customer'}</strong>
                          <span className="text-[10px] text-slate-500">
                            Inv #{o.orderNumber || o.id.slice(-6).toUpperCase()} • {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-700 font-bold block">৳{Number(o.total || 0).toLocaleString()}</strong>
                          <span className="text-[9px] uppercase font-bold text-slate-400">{o.paymentMethod || 'cash'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Services Handled */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                  Recent Service Tickets Handled ({selectedStaff.serviceTickets.length})
                </span>
                {selectedStaff.serviceTickets.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-lg">No service tickets handled in this period.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {selectedStaff.serviceTickets.slice(0, 10).map((s: any) => (
                      <div key={s.id} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between transition-colors">
                        <div>
                          <strong className="text-slate-900 font-bold block">{s.productName || 'Device Service'}</strong>
                          <span className="text-[10px] text-slate-500">
                            Ticket #{s.serialNumber || s.id.slice(-6).toUpperCase()} • Customer: {s.customerName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase block mb-0.5",
                            s.status === 'delivered' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {s.status}
                          </span>
                          <strong className="text-slate-800 text-[11px]">৳{Number(s.serviceCharge || 0).toLocaleString()}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Period: <strong className="text-slate-800">{dateFilter.replace('_', ' ').toUpperCase()}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPerformanceTab;
