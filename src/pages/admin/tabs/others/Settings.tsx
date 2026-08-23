import React, { useState, useEffect } from "react";
import {
  Briefcase,
  ShoppingCart,
  Percent,
  FileText,
  Mail,
  Settings as SettingsIcon,
  MessageCircle,
  ShoppingBag,
  Star,
  CheckSquare,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn, formatCurrency } from "../../../../lib/utils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useSettings } from "../../../../context/SettingsContext";
import { CRMIntegrationsSetting } from "../../../../components/CRMIntegrationsSetting";
import { SiteSettings } from "../../../../types";
import { useAuth } from "../../../../context/AuthContext";

export const Settings = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [settingsFormData, setSettingsFormData] =
    useState<SiteSettings>(settings);
  const [settingsTab, setSettingsTab] = useState<
    | "business"
    | "pos"
    | "tax"
    | "invoice"
    | "zatca"
    | "email"
    | "sms"
    | "whatsapp"
    | "whitelabel"
    | "pwa"
    | "crm_integrations"
    | "review_integrations"
    | "external_ecommerce"
    | "domain_reseller"
  >("business");
  const [taxCalcAmount, setTaxCalcAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, any>>({});
  const [apiKeysLoading, setApiKeysLoading] = useState(true);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/api-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setApiKeys(json.data as any);
        }
      } catch (e) {
        console.error("Error fetching api keys", e);
      } finally {
        setApiKeysLoading(false);
      }
    };
    loadKeys();
  }, [user]);

  useEffect(() => {
    setSettingsFormData(settings);
  }, [settings]);

  const buildApiKeysPayload = () => {
    const secretFields = [
      'dynadotApiKey',
      'resendApiKey',
      'bkashAppKey',
      'bkashAppSecret',
      'bkashUsername',
      'bkashPassword',
      'sandbox_bkashAppKey',
      'sandbox_bkashAppSecret',
      'sandbox_bkashUsername',
      'sandbox_bkashPassword',
      'production_bkashAppKey',
      'production_bkashAppSecret',
      'production_bkashUsername',
      'production_bkashPassword',
      'smtpPassword',
      'smsApiKey',
      'whatsappAccessToken',
    ];

    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(apiKeys)) {
      if (secretFields.includes(key)) {
        if (typeof value === 'string' && value.trim().length > 0 && !value.startsWith('••••••••••••••••')) {
          payload[key] = value.trim();
        }
      } else {
        payload[key] = value;
      }
    }
    return payload;
  };

  const isSecretConfigured = (fieldName: string) => {
    const value = apiKeys[fieldName];
    return typeof value === 'string' && value.startsWith('••••••••••••••••');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (settingsTab === "domain_reseller") {
        const payload = buildApiKeysPayload();
        const token = await user?.getIdToken();
        const res = await fetch('/api/admin/api-config', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to save API configuration');
        }

        const freshRes = await fetch('/api/admin/api-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const freshJson = await freshRes.json();
        if (freshJson.success && freshJson.data) {
          setApiKeys(freshJson.data as any);
        }

        toast.success("API configuration saved successfully");
      } else {
        await updateSettings(settingsFormData);
        toast.success("Site settings updated successfully");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error?.message || "Failed to save site settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Setting List Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-[#7B61FF] text-white">
            <h3 className="font-bold">Setting List</h3>
          </div>
          <div className="p-2 space-y-1">
            {[
              { id: "business", icon: Briefcase, label: "Business Setting" },
              { id: "pos", icon: ShoppingCart, label: "POS Setting" },
              { id: "tax", icon: Percent, label: "Tax Setting" },
              { id: "invoice", icon: FileText, label: "Invoice Setting" },
              { id: "zatca", icon: FileText, label: "Zatca Setting" },
              { id: "email", icon: Mail, label: "Email Setting" },
              { id: "sms", icon: Mail, label: "SMS Setting" },
              { id: "whatsapp", icon: Mail, label: "Whatsapp Setting" },
              {
                id: "whitelabel",
                icon: SettingsIcon,
                label: "Whitelabel Setting",
              },
              { id: "pwa", icon: SettingsIcon, label: "PWA Setting" },
              {
                id: "crm_integrations",
                icon: SettingsIcon,
                label: "CRM Integrations",
              },
              {
                id: "review_integrations",
                icon: MessageCircle,
                label: "Review Integrations",
              },
              {
                id: "external_ecommerce",
                icon: ShoppingBag,
                label: "External E-commerce",
              },
              {
                id: "domain_reseller",
                icon: SettingsIcon,
                label: "Domain Reseller API",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSettingsTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${settingsTab === tab.id ? "bg-[#7B61FF] text-white font-bold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Setting Content */}
      <div className="flex-1 space-y-6">
        <form onSubmit={handleSaveSettings}>
          {settingsTab === "business" ? (
            <>
              {/* Business Setting Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700">
                    Business Setting
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.businessName || ""}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          businessName: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="Computer Zone"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={1}
                      value={settingsFormData.address || ""}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          address: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="1100 Edinger Ave, Tustin, CA 92780"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Website
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={settingsFormData.website || ""}
                        onChange={(e) =>
                          setSettingsFormData({
                            ...settingsFormData,
                            website: e.target.value,
                          })
                        }
                        className="flex-1 text-sm border-gray-200 rounded-l-md focus:ring-[#7B61FF]"
                        placeholder="Enter Website"
                      />
                      <span className="bg-[#7B61FF] text-white px-3 flex items-center justify-center rounded-r-md">
                        <SettingsIcon size={16} />
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={settingsFormData.contactEmail || ""}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          contactEmail: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="info@computerzone.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.contactPhone || ""}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          contactPhone: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="(210) 224-13135"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Default Shipping Cost
                    </label>
                    <input
                      type="number"
                      value={settingsFormData.shippingCost || 0}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          shippingCost: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Date Format <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.dateFormat || "m/d/Y"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          dateFormat: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="m/d/Y">m/d/Y</option>
                      <option value="d/m/Y">d/m/Y</option>
                      <option value="Y-m-d">Y-m-d</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Zone Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.zoneName || "Asia/Dhaka"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          zoneName: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="Asia/Dhaka">Asia/Dhaka</option>
                      <option value="America/Los_Angeles">
                        America/Los_Angeles
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.currency || "Tk."}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          currency: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Currency Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={
                        settingsFormData.currencyPosition || "Before Amount"
                      }
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          currencyPosition: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="Before Amount">Before Amount</option>
                      <option value="After Amount">After Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Precision
                    </label>
                    <select
                      value={settingsFormData.precision || "2 Digit"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          precision: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="2 Digit">2 Digit</option>
                      <option value="0 Digit">0 Digit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Thousand Separator
                    </label>
                    <select
                      value={
                        settingsFormData.thousandSeparator ||
                        "Select Thousand Separator"
                      }
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          thousandSeparator: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="Select Thousand Separator">
                        Select Thousand Separator
                      </option>
                      <option value="Comma (,)">Comma (,)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Decimal Separator <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.decimalSeparator || "Dot (.)"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          decimalSeparator: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="Dot (.)">Dot (.)</option>
                      <option value="Comma (,)">Comma (,)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Installment Days <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.installmentDays || "3 Days"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          installmentDays: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="3 Days">3 Days</option>
                      <option value="7 Days">7 Days</option>
                      <option value="30 Days">30 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      E-Commerce Checker <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.ecommerceChecker || "No"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          ecommerceChecker: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Item Setting Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700">
                    Item Setting
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Is Loyalty Enable <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={settingsFormData.isLoyaltyEnable || "Enable"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          isLoyaltyEnable: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Minimum Point To Redeem{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={settingsFormData.minimumPointToRedeem || 40}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          minimumPointToRedeem: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Loyalty Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settingsFormData.loyaltyRate || 0.1}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          loyaltyRate: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Product Code Start From{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.productCodeStartFrom || "000001"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          productCodeStartFrom: e.target.value,
                        })
                      }
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : settingsTab === "pos" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">POS Setting</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    POS Fast Mode Enable
                  </label>
                  <select
                    value={settingsFormData.posFastMode || "No"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        posFastMode: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Receipt Printer Type
                  </label>
                  <select
                    value={settingsFormData.receiptPrinterType || "Thermal"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        receiptPrinterType: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="Thermal">Thermal Printer</option>
                    <option value="A4">A4 Printer</option>
                  </select>
                </div>
              </div>
            </div>
          ) : settingsTab === "tax" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">Tax Setting</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settingsFormData.defaultTaxRate || 0}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        defaultTaxRate: Number(e.target.value),
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Tax Name
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.taxName || "VAT"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        taxName: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    placeholder="e.g. VAT"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.vatNumber || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        vatNumber: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-700">
                  Tax Calculator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxCalcAmount}
                      onChange={(e) => setTaxCalcAmount(Number(e.target.value))}
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Calculated Tax ({settingsFormData.taxName || "VAT"} @{" "}
                      {settingsFormData.defaultTaxRate || 0}%)
                    </label>
                    <div className="w-full text-sm border-gray-200 rounded-md bg-white p-2 font-bold text-gray-700">
                      {formatCurrency(
                        (taxCalcAmount *
                          (settingsFormData.defaultTaxRate || 0)) /
                          100,
                        settingsFormData,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : settingsTab === "invoice" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">
                  Invoice Setting
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.invoicePrefix || "INV-"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        invoicePrefix: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Invoice Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={settingsFormData.invoiceTerms || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        invoiceTerms: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  ></textarea>
                </div>
              </div>
            </div>
          ) : settingsTab === "zatca" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">
                  Zatca Setting
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    ZATCA e-Invoicing Enable
                  </label>
                  <select
                    value={settingsFormData.zatcaEnable || "No"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        zatcaEnable: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    ZATCA Phase
                  </label>
                  <select
                    value={settingsFormData.zatcaPhase || "1"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        zatcaPhase: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="1">Phase 1</option>
                    <option value="2">Phase 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Commercial Registration Number (CRN)
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.zatcaCrn || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        zatcaCrn: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
              </div>
            </div>
          ) : settingsTab === "email" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">
                  Email Setting
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mail Driver
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.mailDriver || "smtp"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        mailDriver: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mail Host
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.mailHost || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        mailHost: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mail Port
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.mailPort || "587"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        mailPort: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mail Username
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.mailUsername || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        mailUsername: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">SMTP Password:</span> Managed securely on server.
                    Contact your administrator to update SMTP credentials.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Mail Encryption
                  </label>
                  <select
                    value={settingsFormData.mailEncryption || "tls"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        mailEncryption: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                  </select>
                </div>
              </div>
            </div>
          ) : settingsTab === "sms" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">SMS Setting</h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    SMS API URL
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.smsApiUrl || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        smsApiUrl: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">SMS API Key:</span> Managed securely on server.
                    Contact your administrator to update SMS credentials.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.smsSenderId || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        smsSenderId: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
              </div>
            </div>
          ) : settingsTab === "whatsapp" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">
                  Whatsapp Setting
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Whatsapp API URL
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.whatsappApiUrl || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        whatsappApiUrl: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">WhatsApp Access Token:</span> Managed securely on server.
                    Contact your administrator to update WhatsApp credentials.
                  </p>
                </div>
              </div>
            </div>
          ) : settingsTab === "whitelabel" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">
                  Whitelabel Setting
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Application Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.brandName || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        brandName: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    placeholder="My Business App"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.logoUrl || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        logoUrl: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsFormData.primaryColor || "#7B61FF"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="h-9 p-1 w-12 border-gray-200 rounded-md"
                    />
                    <input
                      type="text"
                      value={settingsFormData.primaryColor || "#7B61FF"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : settingsTab === "pwa" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">PWA Setting</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Enable PWA
                  </label>
                  <select
                    value={settingsFormData.pwaEnable || "No"}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        pwaEnable: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    App Name
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.pwaAppName || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        pwaAppName: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.pwaShortName || ""}
                    onChange={(e) =>
                      setSettingsFormData({
                        ...settingsFormData,
                        pwaShortName: e.target.value,
                      })
                    }
                    className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsFormData.pwaThemeColor || "#ffffff"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          pwaThemeColor: e.target.value,
                        })
                      }
                      className="h-9 p-1 w-12 border-gray-200 rounded-md"
                    />
                    <input
                      type="text"
                      value={settingsFormData.pwaThemeColor || "#ffffff"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          pwaThemeColor: e.target.value,
                        })
                      }
                      className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsFormData.pwaBackgroundColor || "#ffffff"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          pwaBackgroundColor: e.target.value,
                        })
                      }
                      className="h-9 p-1 w-12 border-gray-200 rounded-md"
                    />
                    <input
                      type="text"
                      value={settingsFormData.pwaBackgroundColor || "#ffffff"}
                      onChange={(e) =>
                        setSettingsFormData({
                          ...settingsFormData,
                          pwaBackgroundColor: e.target.value,
                        })
                      }
                      className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : settingsTab === "crm_integrations" ? (
            <CRMIntegrationsSetting />
          ) : settingsTab === "review_integrations" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">
                  Review Widget Integration
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                  <Star className="text-blue-500 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">
                      Aggregate Amazon & Google Reviews
                    </p>
                    <p>
                      Use this section to embed third-party review widgets (like
                      Elfsight, Trustpilot, or Reviews.io) that aggregate
                      verified customer feedback from across the web. This is
                      the recommended way to bridge your Amazon reputation into
                      your standalone portal.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">
                        Enable Review Widget
                      </label>
                      <p className="text-xs text-gray-500">
                        Show aggregated reviews on product detail pages
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsFormData({
                          ...settingsFormData,
                          reviewWidgetEnabled:
                            !settingsFormData.reviewWidgetEnabled,
                        })
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        settingsFormData.reviewWidgetEnabled
                          ? "bg-[#7B61FF]"
                          : "bg-gray-200",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          settingsFormData.reviewWidgetEnabled
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>

                  {settingsFormData.reviewWidgetEnabled && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          Integrator Provider
                        </label>
                        <select
                          value={
                            settingsFormData.reviewWidgetProvider || "generic"
                          }
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              reviewWidgetProvider: e.target.value,
                            })
                          }
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        >
                          <option value="generic">Generic Embed Script</option>
                          <option value="elfsight">Elfsight Widget</option>
                          <option value="trustpilot">Trustpilot</option>
                          <option value="reviews_io">Reviews.io</option>
                          <option value="amazon_api">
                            Amazon API (Custom)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          Widget Script / Embed Code
                        </label>
                        <textarea
                          rows={6}
                          value={settingsFormData.reviewWidgetConfig || ""}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              reviewWidgetConfig: e.target.value,
                            })
                          }
                          placeholder='Paste your widget code here, e.g.: <script src="https://static.elfsight.com/platform/platform.js" data-use-service-core defer></script><div class="elfsight-app-YOUR-WIDGET-ID"></div>'
                          className="w-full text-sm font-mono border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        ></textarea>
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-dashed">
                          <strong>Tip:</strong> You can typically find this code
                          in your review provider's dashboard under "Install" or
                          "Embed Code".
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100 bg-gray-50 mt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-700">
                  Internal Review Rewards
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-4">
                  <CheckSquare className="text-green-500 shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-bold mb-1">
                      Reward First-Time Reviewers
                    </p>
                    <p>
                      Automatically issue a one-time discount code when a
                      logged-in user submits their first review on the site.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">
                        Enable Review Rewards
                      </label>
                      <p className="text-xs text-gray-500">
                        Generate a discount code upon first review
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsFormData({
                          ...settingsFormData,
                          reviewRewardEnabled: !(settingsFormData as any)
                            .reviewRewardEnabled,
                        })
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        (settingsFormData as any).reviewRewardEnabled
                          ? "bg-[#7B61FF]"
                          : "bg-gray-200",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          (settingsFormData as any).reviewRewardEnabled
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>

                  {(settingsFormData as any).reviewRewardEnabled && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                        Reward Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={
                          (settingsFormData as any).reviewRewardPercentage || 10
                        }
                        onChange={(e) =>
                          setSettingsFormData({
                            ...settingsFormData,
                            reviewRewardPercentage: Number(e.target.value),
                          })
                        }
                        className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        min={1}
                        max={100}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : settingsTab === "external_ecommerce" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">
                  External E-commerce Integration
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                  <ShoppingBag className="text-blue-500 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">
                      Cross-Post Products to Other Sites
                    </p>
                    <p>
                      Enable this feature to synchronize your products with
                      other e-commerce platforms like Shopify, WooCommerce, or
                      via a custom webhook. You'll be able to "Push" individual
                      products with their price and stock status directly from
                      the inventory list.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">
                        Enable External Sync
                      </label>
                      <p className="text-xs text-gray-500">
                        Allow pushing products to external platforms
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsFormData({
                          ...settingsFormData,
                          externalStoreEnabled:
                            !settingsFormData.externalStoreEnabled,
                        })
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        settingsFormData.externalStoreEnabled
                          ? "bg-[#7B61FF]"
                          : "bg-gray-200",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          settingsFormData.externalStoreEnabled
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>

                  {settingsFormData.externalStoreEnabled && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          External Store Type
                        </label>
                        <select
                          value={
                            settingsFormData.externalStoreType || "webhook"
                          }
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              externalStoreType: e.target.value as any,
                            })
                          }
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        >
                          <option value="webhook">Custom Webhook (JSON)</option>
                          <option value="shopify">Shopify API</option>
                          <option value="woocommerce">
                            WooCommerce REST API
                          </option>
                          <option value="custom">Custom Integration</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          External Store API URL
                        </label>
                        <input
                          type="url"
                          value={settingsFormData.externalStoreUrl || ""}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              externalStoreUrl: e.target.value,
                            })
                          }
                          placeholder="https://external-site.com/api/products"
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          API Key / Secret
                        </label>
                        <input
                          type="password"
                          value={settingsFormData.externalStoreKey || ""}
                          onChange={(e) =>
                            setSettingsFormData({
                              ...settingsFormData,
                              externalStoreKey: e.target.value,
                            })
                          }
                          placeholder="Enter your API Key or Auth Token"
                          className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : settingsTab === "domain_reseller" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700">
                  Domain Reseller API
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-4">
                  <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">
                      Dynadot Reseller Integration
                    </p>
                    <p>
                      Enter your Dynadot API key below to enable real-time
                      domain availability checks and automated registration.
                      Make sure you have whitelisted this server's IP in your
                      Dynadot account.
                    </p>
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Dynadot API Key
                     </label>
                     <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-600 text-sm">
                       Managed securely on server
                     </div>
                     <p className="text-xs text-green-600 mt-1">
                       API key is configured and stored in backend environment variables.
                     </p>
                   </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USD to BDT Exchange Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        ৳
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={apiKeys.usdToBdtRate || 120}
                        onChange={(e) =>
                          setApiKeys({
                            ...apiKeys,
                            usdToBdtRate: parseFloat(e.target.value),
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Used to convert Dynadot USD prices to BDT
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain Profit Margin %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={apiKeys.domainMarkupPercent ?? 15}
                        onChange={(e) =>
                          setApiKeys({
                            ...apiKeys,
                            domainMarkupPercent: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Markup added to Dynadot wholesale price
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain Renewal Year-Based Discount %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={apiKeys.domainRenewalDiscountPercent ?? 0}
                        onChange={(e) =>
                          setApiKeys({
                            ...apiKeys,
                            domainRenewalDiscountPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Discount applied per year for multi-year domain renewals
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hosting Profit Margin %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={apiKeys.hostingMarkupPercent ?? 35}
                        onChange={(e) =>
                          setApiKeys({
                            ...apiKeys,
                            hostingMarkupPercent: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Markup added to CloudLinux license cost for hosting plans
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Pricing Preview</h4>
                    <div className="text-xs text-blue-800 space-y-1 font-mono">
                      <p className="font-bold text-blue-700">Domain Pricing (margin: {apiKeys.domainMarkupPercent ?? 15}%)</p>
                      <p>Wholesale: $10.00 USD</p>
                      <p>Exchange Rate: {apiKeys.usdToBdtRate || 120} BDT/USD</p>
                      <p>Retail USD: ${((10 * (1 + (apiKeys.domainMarkupPercent ?? 15) / 100)).toFixed(2))}</p>
                      <p className="font-bold">Final BDT: ৳{Math.round(10 * (apiKeys.usdToBdtRate || 120) * (1 + (apiKeys.domainMarkupPercent ?? 15) / 100)).toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-blue-800 space-y-1 font-mono mt-3 pt-3 border-t border-blue-200">
                      <p className="font-bold text-blue-700">Hosting Pricing (margin: {apiKeys.hostingMarkupPercent ?? 35}%)</p>
                      <p>License Cost: $10.00 USD</p>
                      <p>Exchange Rate: {apiKeys.usdToBdtRate || 120} BDT/USD</p>
                      <p>Retail USD: ${((10 * (1 + (apiKeys.hostingMarkupPercent ?? 35) / 100)).toFixed(2))}</p>
                      <p className="font-bold">Final BDT: ৳{Math.round(10 * (apiKeys.usdToBdtRate || 120) * (1 + (apiKeys.hostingMarkupPercent ?? 35) / 100)).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">
                        Sandbox Mode
                      </label>
                      <p className="text-xs text-gray-500">
                        Use Dynadot Sandbox API for testing without spending
                        money
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setApiKeys({
                          ...apiKeys,
                          isSandboxMode: !apiKeys.isSandboxMode,
                        })
                      }
                      className={
                        apiKeys.isSandboxMode
                          ? "relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-[#7B61FF]"
                          : "relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200"
                      }
                    >
                      <span
                        className={
                          apiKeys.isSandboxMode
                            ? "inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"
                            : "inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"
                        }
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-4 mb-6">
                    <div className="text-sm text-emerald-800">
                      <p className="font-bold mb-1">
                        bKash Payment Gateway Integration
                      </p>
                      <p>
                        bKash credentials are stored securely on the server and
                        cannot be edited from this panel.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">bKash Credentials:</span> Managed securely on server.
                    Contact your administrator to update bKash sandbox/production credentials.
                  </p>
                </div>
                </div>
                <div className="mt-8 pt-6 border-t">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-4 mb-6">
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">
                        CloudLinux Partner API Integration
                      </p>
                      <p>
                        CloudLinux credentials are stored securely on the server
                        and cannot be edited from this panel.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold">CloudLinux CLN Credentials:</span> Managed securely on server.
                    Contact your administrator to update CloudLinux credentials.
                  </p>
                </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 capitalize">
                  {settingsTab.replace(/([A-Z])/g, " $1").trim()} Setting
                </h3>
              </div>
              <div className="p-6 text-center py-12 text-gray-400">
                <SettingsIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg capitalize">
                  {settingsTab.replace(/([A-Z])/g, " $1").trim()} Module
                </p>
                <p className="text-sm">
                  Configuring options for {settingsTab} are under development.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pb-12">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#7B61FF] text-white rounded-md font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <CheckSquare size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
