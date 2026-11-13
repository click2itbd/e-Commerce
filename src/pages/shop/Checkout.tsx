// @ts-nocheck
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { Layout } from "../../components/Layout";
import { toast } from "react-hot-toast";
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, Loader2, MapPin, CheckCircle2, Plus, Sparkles, Gift, CreditCard } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
} from "firebase/auth";
import { generatePDF } from "../../lib/pdf";
import { initiateEpsPayment } from "../../services/paymentApi";
import { apiPost } from "../../services/apiClient";
import {
  BANK_EMI_PLANS,
  MINIMUM_EMI_PURCHASE,
  getBankEMIOptions,
  EMITenureKey,
} from "../../data/emiPlans";

const BD_DISTRICTS = [
  "Dhaka",
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria",
  "Chandpur", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla",
  "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", "Joypurhat",
  "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia",
  "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur",
  "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj",
  "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali",
  "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi",
  "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj",
  "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export const Checkout: React.FC = () => {
  const { user } = useAuth();
  const {
    items,
    subtotal,
    total,
    appliedDiscount,
    clearCart,
    isShippingFree,
    addToCart,
  } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "Bangladesh",
    source: "None",
    domainContact: "default",
    password: "",
    confirmPassword: "",
    paymentMethod: "eps",
    notes: "",
    termsAccepted: false,
  });

  const [shippingConfig, setShippingConfig] = useState({
    insideDhaka: 80,
    outsideDhaka: 120,
    freeShippingThreshold: 5000,
    enableFreeShipping: false,
  });

  React.useEffect(() => {
    const fetchShipping = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "ecommerce_shipping"));
        if (snap.exists()) {
          setShippingConfig(snap.data() as any);
        }
      } catch (e) {}
    };
    fetchShipping();
  }, []);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const bdDomain = searchParams.get("bd_domain");
    const appId = searchParams.get("app_id");

    if (bdDomain && appId) {
      const exists = items.some((item) => item.id === `domain_${bdDomain}`);
      if (!exists) {
        const product = {
          id: `domain_${bdDomain}`,
          name: `Domain Registration - ${bdDomain}`,
          description: "2 Years Registration",
          price: 1840,
          category: "Hosting & Domains",
          stock: 9999,
          images: [],
          createdAt: new Date().toISOString(),
          itemType: "domain" as const,
          domainTld: bdDomain.split(".").slice(1).join("."),
          termYears: 2,
          bdAppId: appId,
        };
        addToCart(product);
        toast.success(`${bdDomain} added to cart`);
      }
    }
  }, []);

  const isDhaka = (formData.city || "").trim().toLowerCase() === "dhaka";
  let shippingCost = 0;
  if (formData.city) {
    if (isDhaka) {
      shippingCost = Number(shippingConfig.insideDhaka) || 80;
    } else {
      shippingCost = Number(shippingConfig.outsideDhaka) || 120;
    }
  }

  if (
    isShippingFree ||
    (shippingConfig.enableFreeShipping &&
      subtotal >= shippingConfig.freeShippingThreshold)
  ) {
    shippingCost = 0;
  }

  const [paymentType, setPaymentType] = useState<"cod" | "pay_now">("cod");
  const isAdvanceCOD =
    paymentType === "cod" &&
    Boolean(settings?.requireAdvanceDeliveryCharge) &&
    shippingCost > 0;
  const grandTotal = total + shippingCost;

  // EMI Configuration States
  const [isEmiSelected, setIsEmiSelected] = useState<boolean>(false);
  const [selectedEmiBankId, setSelectedEmiBankId] = useState<string>(BANK_EMI_PLANS[0]?.id || "eastern-bank");
  const [selectedEmiTenureKey, setSelectedEmiTenureKey] = useState<EMITenureKey>("12M");

  const selectedEmiBank = React.useMemo(() => {
    return BANK_EMI_PLANS.find((b) => b.id === selectedEmiBankId) || BANK_EMI_PLANS[0];
  }, [selectedEmiBankId]);

  const availableEmiOptions = React.useMemo(() => {
    if (grandTotal < MINIMUM_EMI_PURCHASE) return [];
    return getBankEMIOptions(grandTotal, selectedEmiBank.id);
  }, [grandTotal, selectedEmiBank.id]);

  const activeEmiOption = React.useMemo(() => {
    if (availableEmiOptions.length === 0) return null;
    const found = availableEmiOptions.find((o) => o.tenureKey === selectedEmiTenureKey);
    return found || availableEmiOptions[0] || null;
  }, [availableEmiOptions, selectedEmiTenureKey]);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);
  const [saveAddressToBook, setSaveAddressToBook] = useState(true);

  const applyAddressToForm = (addr: any) => {
    if (!addr) return;

    let fName = "";
    let lName = "";
    if (addr.name) {
      const parts = String(addr.name).trim().split(/\s+/);
      if (parts.length > 1) {
        fName = parts.slice(0, -1).join(" ");
        lName = parts.slice(-1).join(" ");
      } else {
        fName = parts[0] || "";
      }
    }

    let rawPhone = String(addr.phone || "").replace(/\D/g, "");
    if (rawPhone.startsWith("880")) rawPhone = rawPhone.slice(3);
    else if (rawPhone.startsWith("88")) rawPhone = rawPhone.slice(2);
    rawPhone = rawPhone.replace(/^0+/, "");
    const cleanPhone = rawPhone.slice(0, 10);

    const addrCity = addr.city || addr.district || "";

    setFormData((prev) => ({
      ...prev,
      firstName: fName || prev.firstName,
      lastName: lName || prev.lastName,
      phone: cleanPhone || prev.phone,
      address1: addr.address || prev.address1,
      city: addrCity || prev.city,
      state: addrCity?.toLowerCase() === "dhaka" ? "Dhaka" : "Outside Dhaka",
    }));
  };

  React.useEffect(() => {
    const loadUserAddresses = async () => {
      if (!user) {
        setIsAddressesLoaded(true);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const addrs = Array.isArray(uData.addresses) ? uData.addresses : [];
          setSavedAddresses(addrs);

          if (addrs.length > 0) {
            const defIdx = addrs.findIndex((a: any) => a.isDefault);
            const activeIdx = defIdx >= 0 ? defIdx : 0;
            setSelectedAddressIndex(activeIdx);
            applyAddressToForm(addrs[activeIdx]);
          } else if (uData.address || uData.phone || uData.name) {
            const singleAddr = {
              type: "Home",
              name: uData.name || user.displayName || "",
              phone: uData.phone || "",
              address: uData.address || "",
              city: uData.city || "",
              isDefault: true,
            };
            setSavedAddresses([singleAddr]);
            setSelectedAddressIndex(0);
            applyAddressToForm(singleAddr);
          }
        }
      } catch (e) {
        console.warn("Failed to load user saved addresses", e);
      } finally {
        setIsAddressesLoaded(true);
      }
    };

    loadUserAddresses();
  }, [user]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      city: val,
      state: val.toLowerCase() === "dhaka" ? "Dhaka" : "Outside Dhaka",
    }));
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    if (e.target.name === "phone") {
      let val = String(value).replace(/\D/g, "");
      if (val.startsWith("880")) val = val.slice(3);
      else if (val.startsWith("88")) val = val.slice(2);
      val = val.replace(/^0+/, "");
      val = val.slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: val }));
      return;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google!");
    } catch (error: any) {
      console.error("Google sign in error:", error);
      if (error?.code === "auth/unauthorized-domain") {
        const hostname = window.location.hostname;
        toast.error(
          `Domain "${hostname}" is not authorized in Firebase. Add it under Firebase Console -> Auth -> Settings -> Authorized Domains.`,
          { duration: 8000 },
        );
      } else if (error?.code === "auth/popup-blocked") {
        toast.error(
          "Pop-up blocked by browser. Please enable pop-ups for this site.",
        );
      } else if (error?.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in pop-up was closed.");
      } else {
        toast.error(error?.message || "Google sign in failed");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.termsAccepted) {
      toast.error("You must agree to the Terms of Service.");
      return;
    }

    const cleanPhone = formData.phone
      .replace(/\D/g, "")
      .replace(/^(?:880|88)?0?/, "");
    const phoneRegex = /^1[3-9]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      toast.error(
        "অনুগ্রহ করে একটি সঠিক ১০-ডিজিট মোবাইল নম্বর দিন (যেমন: 17XXXXXXXX)।",
      );
      return;
    }
    const fullPhone = `+880${cleanPhone}`;

    if (!formData.city) {
      toast.error("অনুগ্রহ করে আপনার জেলা (District) নির্বাচন করুন।");
      return;
    }

    if (!formData.address1?.trim()) {
      toast.error("অনুগ্রহ করে আপনার পূর্ণ ডেলিভারি ঠিকানা দিন।");
      return;
    }

    setIsProcessing(true);

    try {
      // Frictionless / Silent Guest Authentication: no password required!
      let currentAuthUser = auth.currentUser || user;
      if (!currentAuthUser) {
        try {
          const anonRes = await signInAnonymously(auth);
          currentAuthUser = anonRes.user;
        } catch (anonErr) {
          console.warn("signInAnonymously failed, falling back to silent guest account:", anonErr);
          const guestEmail = formData.email?.trim() || `guest_${cleanPhone}_${Date.now()}@click2itbd.com`;
          const autoPwd = `Guest#${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}!`;
          try {
            const cred = await createUserWithEmailAndPassword(auth, guestEmail, autoPwd);
            currentAuthUser = cred.user;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              const fallbackEmail = `guest_${cleanPhone}_${Date.now()}@click2itbd.com`;
              const cred = await createUserWithEmailAndPassword(auth, fallbackEmail, autoPwd);
              currentAuthUser = cred.user;
            } else {
              throw createErr;
            }
          }
        }
      }

      if (!currentAuthUser) {
        throw new Error("অর্ডার প্রসেসিংয়ে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
      const token = await currentAuthUser.getIdToken();

      let affiliateRefId = null;
      try {
        const stored = localStorage.getItem("affiliate_ref");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.expiry > Date.now()) {
            affiliateRefId = parsed.code;
          } else {
            localStorage.removeItem("affiliate_ref");
          }
        }
      } catch (e) {}

      const customerFullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.firstName || "Customer";

      const minimalItems = items.map((item: any) => ({
        id: item.id,
        productId: item.productId || item.id,
        variantId: item.variantId || undefined,
        quantity: item.quantity || 1,
        itemType: item.itemType,
        domain: item.domain,
        domainTld: item.domainTld,
        termYears: item.termYears,
        billingCycle: item.billingCycle,
        planId: item.planId,
        planSlug: item.planSlug,
        bdAppId: item.bdAppId,
        details: item.details,
      }));

      const emiDetailsPayload =
        isEmiSelected && grandTotal >= MINIMUM_EMI_PURCHASE && activeEmiOption && selectedEmiBank
          ? {
              isEmi: true,
              bankId: selectedEmiBank.id,
              bankName: selectedEmiBank.name,
              shortName: selectedEmiBank.shortName,
              tenureKey: activeEmiOption.tenureKey,
              months: activeEmiOption.months,
              rate: activeEmiOption.rate,
              monthlyAmount: activeEmiOption.monthlyInstallment,
              totalAmount: activeEmiOption.totalPayable,
            }
          : null;

      const emiPaymentMethodString = emiDetailsPayload
        ? `Payment via ${selectedEmiBank.shortName} ${activeEmiOption.months}-Month EMI`
        : paymentType === "cod"
          ? isAdvanceCOD
            ? "cod_advance_paid"
            : "cod"
          : "eps";

      const createRes = await apiPost(
        "/api/orders/create",
        {
          platform: "ecommerce",
          items: minimalItems,
          couponCode: appliedDiscount ? appliedDiscount.code : null,
          customerName: customerFullName,
          customerEmail: formData.email?.trim() || "",
          customerPhone: fullPhone,
          shippingAddress: `${formData.address1}, ${formData.city}, Bangladesh`,
          city: formData.city,
          state: isDhaka ? "Dhaka" : "Outside Dhaka",
          company: formData.company,
          paymentType: isEmiSelected ? "pay_now" : paymentType,
          advanceDelivery: isAdvanceCOD,
          paymentMethod: emiPaymentMethodString,
          emiDetails: emiDetailsPayload,
          notes: formData.notes,
          affiliateRefId,
        },
        token,
      );

      if (!createRes?.success || !createRes?.orderId) {
        throw new Error(createRes?.error || "Failed to create order on server");
      }

      const createdOrderId = createRes.orderId;
      const serverOrderData = createRes.orderData;

      if (emiDetailsPayload) {
        try {
          await updateDoc(doc(db, "orders", createdOrderId), {
            emiDetails: emiDetailsPayload,
            paymentMethod: emiPaymentMethodString,
          });
          if (serverOrderData) {
            serverOrderData.emiDetails = emiDetailsPayload;
            serverOrderData.paymentMethod = emiPaymentMethodString;
          }
        } catch (emiErr) {
          console.warn("Could not sync emiDetails to Firestore order:", emiErr);
        }
      }

      // Sync customer to 'customers' collection so they appear in Ecommerce Dashboard & Admin
      try {
        const customerQ = query(collection(db, "customers"), where("phone", "==", fullPhone));
        const customerSnap = await getDocs(customerQ);
        const orderEarnedPoints = user ? Math.floor(grandTotal / 1000) * 10 : 0;

        if (customerSnap.empty) {
          await addDoc(collection(db, "customers"), {
            name: customerFullName,
            phone: fullPhone,
            email: formData.email?.trim() || "",
            address: `${formData.address1}, ${formData.city}`,
            city: formData.city || "",
            state: isDhaka ? "Dhaka" : "Outside Dhaka",
            source: "ecommerce",
            createdAt: new Date().toISOString(),
            loyaltyPoints: orderEarnedPoints,
            totalOrders: 1,
            totalSpent: grandTotal,
          });
        } else {
          const custDoc = customerSnap.docs[0];
          const existing = custDoc.data() || {};
          await updateDoc(doc(db, "customers", custDoc.id), {
            name: customerFullName || existing.name,
            email: formData.email?.trim() || existing.email || "",
            address: `${formData.address1}, ${formData.city}` || existing.address || "",
            city: formData.city || existing.city || "",
            updatedAt: new Date().toISOString(),
            loyaltyPoints: (Number(existing.loyaltyPoints) || 0) + orderEarnedPoints,
            totalOrders: (Number(existing.totalOrders) || 0) + 1,
            totalSpent: (Number(existing.totalSpent) || 0) + grandTotal,
          });
        }
      } catch (custErr) {
        console.warn("Could not sync customer to customers collection:", custErr);
      }

      if (user && saveAddressToBook) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const newAddrItem = {
            id: Date.now().toString(),
            type: "Home",
            name: customerFullName,
            phone: fullPhone,
            state: isDhaka ? "Dhaka" : "Outside Dhaka",
            city: formData.city,
            address: formData.address1,
            isDefault: savedAddresses.length === 0,
          };

          const exists = savedAddresses.some(
            (a) =>
              a.address?.toLowerCase() === formData.address1?.toLowerCase() &&
              a.city?.toLowerCase() === formData.city?.toLowerCase()
          );
          if (!exists) {
            const updatedAddrs = [...savedAddresses, newAddrItem];
            await setDoc(userDocRef, { addresses: updatedAddrs }, { merge: true });
          }
        } catch (e) {
          console.warn("Could not save address to user profile:", e);
        }
      }

      // Online payment ("Pay Now" or Advance COD delivery fee) strictly routes through EPS Payment Gateway
      // Do NOT send order confirmation emails until EPS payment is verified!
      if (paymentType === "pay_now" || isAdvanceCOD) {
        let redirectUrl = createRes.paymentUrl || createRes.redirectUrl;
        if (!redirectUrl) {
          const epsRes = await initiateEpsPayment(createdOrderId, token);
          redirectUrl = epsRes.paymentUrl || epsRes.redirectUrl;
        }
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        } else {
          throw new Error("অনলাইন পেমেন্ট গেটওয়েতে সাময়িক সমস্যা দেখা দিয়েছে। অনুগ্রহ করে 'Cash on Delivery' বেছে নিন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।");
        }
      }

      // Pure Cash on Delivery (no online payment required)
      try {
        await apiPost(
          "/api/send-email/notify-admin-new-order",
          { orderId: createdOrderId, orderData: serverOrderData },
          token,
        );

        const pdfDoc = await generatePDF(
          { id: createdOrderId, ...serverOrderData } as any,
          "invoice",
          settings,
          "doc",
        );
        const pdfBase64 = pdfDoc.output("datauristring");

        await apiPost(
          "/api/send-email/order-confirmation",
          {
            orderId: createdOrderId,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            attachments: [
              {
                filename: `Invoice-${createdOrderId}.pdf`,
                content: pdfBase64.split("base64,")[1],
                encoding: "base64",
                contentType: "application/pdf",
              },
            ],
          },
          token,
        );
      } catch (err) {
        console.error("Failed to send order emails:", err);
      }

      clearCart();
      navigate(`/order-success/${createdOrderId}`);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      console.error("Checkout error:", error);
      const rawMsg = error.message || "Failed to place order";
      const isGatewayError =
        /EPS|InitializeEPS|HTTP \d+|GetToken|x-hash|gateway|timeout/i.test(rawMsg);
      const customerMsg = isGatewayError
        ? "অনলাইন পেমেন্ট গেটওয়েতে সাময়িক সমস্যা দেখা দিয়েছে। অনুগ্রহ করে 'ক্যাশ অন ডেলিভারি' (Cash on Delivery) বেছে নিন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।"
        : rawMsg;
      toast.error(customerMsg);
      setSubmitError(customerMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-1 sm:pt-4 pb-2 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              অর্ডার সম্পন্ন করুন (Checkout)
            </h1>
            {/* <p className="text-slate-500 text-xs sm:text-sm mt-1">
              লগইন ছাড়াই সহজে ও দ্রুত নাম, নম্বর ও ঠিকানা দিয়ে অর্ডার সম্পন্ন করুন।
            </p> */}
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="self-start sm:self-auto bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 sm:px-5 py-2 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              পূর্বে অ্যাকাউন্ট থাকলে লগইন করুন
            </button>
          )}
        </div>

        {/* Loyalty Reward Banner (Optional login bonus) */}
        {!user && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/60 border border-amber-200/90 rounded-2xl p-3.5 sm:p-5 mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5 sm:gap-3.5">
              <div className="p-2 sm:p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <Sparkles size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-base">
                    লগইন করে অর্ডার করলে রিওয়ার্ড পয়েন্ট বোনাস!
                  </h4>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    ১০ পয়েন্ট / ১০০০৳
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                  লগইন করা থাকলে প্রতি <strong>১,০০০ টাকা</strong> কেনাকাটায় <strong>১০ পয়েন্ট</strong> আপনার অ্যাকাউন্টে জমা হবে, যা পরবর্তীতে যেকোনো অর্ডারে টাকা হিসেবে রিডিম করতে পারবেন (*শর্ত প্রযোজ্য)। আপনি চাইলে কোনো <strong>লগইন ছাড়াই সরাসরি</strong> অর্ডার করতে পারেন।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-3.5 h-3.5"
                />
                Google Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-[#0E2A47] hover:bg-[#0E2A47]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100"
        >
          {/* Saved Addresses Section (Only for Logged In Users) */}
          {user && savedAddresses.length >= 2 && (
            <div className="mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin size={16} className="text-orange-500 shrink-0" />
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    সংরক্ষিত ঠিকানা
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({savedAddresses.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressIndex(-1);
                      setFormData((prev) => ({
                        ...prev,
                        firstName: "",
                        lastName: "",
                        phone: "",
                        address1: "",
                        city: "",
                        state: "",
                      }));
                      toast("নতুন ঠিকানা নিচে লিখুন", { icon: "✏️" });
                    }}
                    className={`cursor-pointer text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      selectedAddressIndex === -1
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Plus size={11} /> নতুন ঠিকানা
                  </button>
                  <Link
                    to="/profile?tab=profile"
                    target="_blank"
                    className="text-[10px] sm:text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-2 sm:px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    Address Book →
                  </Link>
                </div>
              </div>

              {/* Mobile: Horizontal scrollable cards with snap; Desktop: Multi-column grid */}
              <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 no-scrollbar snap-x snap-mandatory">
                {savedAddresses.map((addr, idx) => {
                  const isSelected = selectedAddressIndex === idx;
                  const fullAddressLine = [addr.address, addr.city, addr.state].filter(Boolean).join(", ");

                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setSelectedAddressIndex(idx);
                        applyAddressToForm(addr);
                        toast.success(`"${addr.type || "Address " + (idx + 1)}" নির্বাচিত হয়েছে`);
                      }}
                      className={`cursor-pointer text-left rounded-xl p-3 sm:px-3.5 sm:py-2.5 border transition-all flex flex-col gap-1 min-w-[240px] max-w-[260px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/30"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 w-full">
                        <span
                          className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "bg-slate-200/80 text-slate-600"
                          }`}
                        >
                          {addr.type || "Home"}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs mt-0.5">
                        <span className="font-bold text-slate-900 truncate">
                          {addr.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">
                          {addr.phone}
                        </span>
                      </div>

                      <p
                        className="text-[11px] text-slate-500 truncate w-full"
                        title={fullAddressLine}
                      >
                        {fullAddressLine}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {user && savedAddresses.length === 1 && (
            <div className="mb-6 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                সংরক্ষিত ঠিকানা থেকে স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে ({savedAddresses[0].name})।
              </span>
              <Link to="/profile?tab=profile" target="_blank" className="font-bold text-emerald-700 hover:underline shrink-0 ml-2">
                ম্যানেজ করুন →
              </Link>
            </div>
          )}

          {/* Customer Delivery Details Section */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              গ্রাহক ও ডেলিভারির তথ্য
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5">
                  আপনার সম্পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="যেমন: মোঃ রহিম উদ্দিন"
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all font-medium text-slate-900"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5">
                  মোবাইল নম্বর (Phone Number) <span className="text-rose-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 sm:px-3.5 border border-r-0 border-slate-200 bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-l-xl select-none">
                    <img
                      src="https://flagcdn.com/w20/bd.png"
                      alt="BD"
                      className="w-3.5 sm:w-4 h-auto mr-1 sm:mr-1.5 rounded-xs shadow-2xs"
                    />{" "}
                    +880
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="1XXXXXXXXX"
                    maxLength={10}
                    required
                    className="border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 rounded-r-xl text-xs sm:text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all flex-1 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5 flex items-center justify-between">
                  <span>ইমেইল ঠিকানা (Email)</span>
                  <span className="text-[9px] sm:text-[10px] font-normal text-slate-400 lowercase">(ঐচ্ছিক / রিসিটের জন্য)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@mail.com"
                  className="border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-800"
                />
              </div>

              {/* District (Only Jila as requested) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5">
                  ডেলিভারির জেলা (District) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleDistrictChange}
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="" disabled>
                    -- জেলা নির্বাচন করুন (Select District) --
                  </option>
                  {BD_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district === "Dhaka" ? "Dhaka (ঢাকা)" : district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Address */}
              <div className="md:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5">
                  সম্পূর্ণ ডেলিভারি ঠিকানা (Full Address) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  placeholder="বাসা নম্বর, রোড নম্বর, এলাকা বা ল্যান্ডমার্ক..."
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-900"
                />
              </div>

              {/* Order Notes */}
              <div className="md:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1 sm:mb-1.5">
                  অর্ডার সংক্রান্ত বিশেষ নোট (Optional Notes)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="ডেলিভারিম্যানের জন্য কোনো বিশেষ নির্দেশনা থাকলে এখানে লিখুন..."
                  rows={2}
                  className="border border-slate-200 bg-slate-50/50 p-2.5 sm:p-3 rounded-xl text-xs w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all resize-none text-slate-800"
                />
              </div>

              {user && (
                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveAddressToBook"
                    name="saveAddressToBook"
                    checked={saveAddressToBook}
                    onChange={(e) => setSaveAddressToBook(e.target.checked)}
                    className="w-4 h-4 text-[#0E2A47] rounded border-slate-300 focus:ring-[#0E2A47] cursor-pointer"
                  />
                  <label htmlFor="saveAddressToBook" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    ভবিষ্যৎ অর্ডারের সুবিধার জন্য এই ঠিকানাটি সেভ করে রাখুন
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Domain Specific Notice (Only if Cart has .bd domain) */}
          {items.some((item) => item.itemType === "domain") && (
            <div className="mb-8 border border-blue-200 bg-blue-50/50 rounded-2xl p-5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-2">
                .BD Domain Registrant Info
              </span>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                ডোমেইন রেজিস্ট্রেশনের ক্ষেত্রে উপরের যোগাযোগের তথ্য ব্যবহৃত হবে। আপনি চাইলে বিকল্প তথ্য প্রদান করতে পারেন।
              </p>
              <select
                name="domainContact"
                value={formData.domainContact}
                onChange={handleChange}
                className="border border-slate-200 p-2.5 rounded-xl text-xs bg-white text-slate-800"
              >
                <option value="default">Use Contact Details Above</option>
                <option value="custom">Provide Custom Contact</option>
              </select>
            </div>
          )}

              <div className="mb-8 sm:mb-12 relative border-t border-slate-200 pt-6 sm:pt-8">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 sm:px-6 py-0.5 sm:py-1 rounded-full text-slate-800 text-xs sm:text-sm font-semibold border border-slate-100 shadow-xs whitespace-nowrap">
                  Payment Details
                </span>

                <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
                  <div className="space-y-2.5 sm:space-y-3 max-w-sm mx-auto text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        ৳ {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 pb-2.5 sm:pb-3 border-b border-slate-200">
                      <span>Shipping:</span>
                      <span className="font-semibold">
                        ৳ {shippingCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 pt-1">
                      <span className="font-bold text-base sm:text-lg">Total Due:</span>
                      <span className="font-black text-lg sm:text-xl text-[#6EC72A]">
                        ৳ {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-slate-600 font-bold text-xs sm:text-sm mb-4 sm:mb-6">
                  Select Payment Method
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto mb-6">
                  {/* Option 1: Cash on Delivery */}
                  <div
                    onClick={() => {
                      setPaymentType("cod");
                      setIsEmiSelected(false);
                    }}
                    className={`cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border-2 transition-all flex flex-col justify-between ${
                      paymentType === "cod" && !isEmiSelected
                        ? "border-[#0E2A47] bg-[#0E2A47]/5 shadow-xs ring-1 ring-[#0E2A47]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentType === "cod" && !isEmiSelected ? "border-[#0E2A47]" : "border-slate-400"
                        }`}
                      >
                        {paymentType === "cod" && !isEmiSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#0E2A47]" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        Cash on Delivery
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500">
                      পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন
                    </span>
                  </div>

                  {/* Option 2: Pay Now (Direct Online) */}
                  <div
                    onClick={() => {
                      setPaymentType("pay_now");
                      setIsEmiSelected(false);
                    }}
                    className={`cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border-2 transition-all flex flex-col justify-between ${
                      paymentType === "pay_now" && !isEmiSelected
                        ? "border-[#0E2A47] bg-[#0E2A47]/5 shadow-xs ring-1 ring-[#0E2A47]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentType === "pay_now" && !isEmiSelected ? "border-[#0E2A47]" : "border-slate-400"
                        }`}
                      >
                        {paymentType === "pay_now" && !isEmiSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#0E2A47]" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        Pay Now
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500">
                      Card / bKash / Nagad / Net Banking
                    </span>
                  </div>

                  {/* Option 3: Credit Card EMI */}
                  <div
                    onClick={() => {
                      if (grandTotal >= MINIMUM_EMI_PURCHASE) {
                        setPaymentType("pay_now");
                        setIsEmiSelected(true);
                      } else {
                        toast.error(`Credit Card EMI-র জন্য ন্যূনতম অর্ডারের পরিমাণ ৳ ${MINIMUM_EMI_PURCHASE.toLocaleString('en-IN')}`);
                      }
                    }}
                    className={`cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                      isEmiSelected
                        ? "border-[#F97316] bg-orange-50/40 shadow-xs ring-2 ring-[#F97316]"
                        : grandTotal >= MINIMUM_EMI_PURCHASE
                        ? "border-slate-200 hover:border-orange-300 bg-white"
                        : "border-slate-100 bg-slate-50/70 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isEmiSelected ? "border-[#F97316]" : "border-slate-400"
                        }`}
                      >
                        {isEmiSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        Credit Card EMI
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#F97316] text-white">
                          EMI
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500">
                      {grandTotal >= MINIMUM_EMI_PURCHASE ? "৩ - ৩৬ মাসের কিস্তি (১৬টি ব্যাংক)" : "ন্যূনতম ৳ ৫,০০০ অর্ডারে প্রযোজ্য"}
                    </span>
                  </div>
                </div>

                {/* Interactive EMI Bank & Tenure Selector Panel */}
                {isEmiSelected && grandTotal >= MINIMUM_EMI_PURCHASE && (
                  <div className="max-w-3xl mx-auto mb-6 sm:mb-8 bg-gradient-to-b from-orange-50/60 to-white border-2 border-[#F97316]/30 rounded-2xl p-3.5 sm:p-6 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-orange-100 gap-2">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center shrink-0">
                          <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-base">
                            Credit Card EMI কিস্তি নির্বাচন
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-500">
                            আপনার পছন্দের ব্যাংক ও কিস্তির মেয়াদ সিলেক্ট করুন
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/emi-terms"
                        target="_blank"
                        className="text-[11px] sm:text-xs font-bold text-[#F97316] hover:underline whitespace-nowrap self-end sm:self-auto"
                      >
                        EMI পলিসি ও শর্তাবলী →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3.5 sm:mt-4">
                      {/* Bank Dropdown */}
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 sm:mb-1.5">
                          ১. ব্যাংক নির্বাচন করুন (১৬টি ব্যাংক)
                        </label>
                        <select
                          value={selectedEmiBankId}
                          onChange={(e) => {
                            setSelectedEmiBankId(e.target.value);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all shadow-xs"
                        >
                          {BANK_EMI_PLANS.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.shortName} — {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tenure Selector */}
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 sm:mb-1.5">
                          ২. কিস্তির মেয়াদ (মাস)
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5">
                          {availableEmiOptions.map((opt) => (
                            <button
                              key={opt.tenureKey}
                              type="button"
                              onClick={() => setSelectedEmiTenureKey(opt.tenureKey)}
                              className={`py-1.5 sm:py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                                selectedEmiTenureKey === opt.tenureKey
                                  ? "bg-[#0E2A47] text-white border-[#0E2A47] shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-extrabold">{opt.months}M</div>
                              <div className="text-[9px] font-normal opacity-80">{opt.rate}%</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* EMI Calculation Summary Breakdown */}
                    {activeEmiOption && (
                      <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-white rounded-xl border border-orange-200 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[11px] sm:text-xs text-slate-500 block">নির্বাচিত প্ল্যান:</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {selectedEmiBank.name} ({activeEmiOption.months} Months)
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-[11px] sm:text-xs text-slate-500 block">মাসিক কিস্তি:</span>
                            <span className="text-lg sm:text-xl font-black text-[#F97316]">
                              ৳ {Math.round(activeEmiOption.monthlyInstallment).toLocaleString('en-IN')}{" "}
                              <span className="text-[11px] sm:text-xs text-slate-500 font-normal">/ মাস</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs pt-3 text-slate-600">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">প্রোডাক্ট মোট:</span>
                            <span className="font-bold text-slate-800">৳ {Math.round(grandTotal).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">ব্যাংক চার্জ ({activeEmiOption.rate}%):</span>
                            <span className="font-bold text-slate-800">+ ৳ {Math.round(activeEmiOption.chargeAmount).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-orange-50/70 border border-orange-200/50 p-2 rounded-lg">
                            <span className="text-slate-500 block text-[10px]">মোট পরিশোধযোগ্য:</span>
                            <span className="font-black text-slate-900">৳ {Math.round(activeEmiOption.totalPayable).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-emerald-50/70 border border-emerald-200/50 p-2 rounded-lg">
                            <span className="text-slate-500 block text-[10px]">অর্ডার মেথড:</span>
                            <span className="font-bold text-emerald-800 truncate block text-[11px]" title={`Payment via ${selectedEmiBank.shortName} ${activeEmiOption.months}-Month EMI`}>
                              {selectedEmiBank.shortName} {activeEmiOption.months}M
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
                          ℹ️ <strong>নির্দেশনা:</strong> অর্ডার সাবমিট করার পর অনলাইন গেটওয়েতে কার্ড অপশন বেছে নিয়ে আপনার <strong>{selectedEmiBank.shortName}</strong> ক্রেডিট কার্ড ব্যবহার করে ট্রানজ্যাকশন সম্পন্ন করুন। ব্যাংক স্বয়ংক্রিয়ভাবে {activeEmiOption.months} মাসের কিস্তিতে কনভার্ট করবে।
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Info Box for general awareness */}
                {!isEmiSelected && grandTotal >= MINIMUM_EMI_PURCHASE && (
                  <div className="max-w-3xl mx-auto mb-6 p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={18} className="text-[#F97316] shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">
                          Credit Card EMI Available (16 Banks, 3 to 36 Months)
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          উপরে <strong>Credit Card EMI</strong> অপশন সিলেক্ট করে সরাসরি কিস্তির হিসাব বেছে নিন।
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/emi-terms"
                      target="_blank"
                      className="text-xs font-bold text-[#3749bb] hover:underline shrink-0 whitespace-nowrap self-end sm:self-center"
                    >
                      View Rates →
                    </Link>
                  </div>
                )}
              </div>

              {items.some(
                (item) =>
                  item.itemType === "domain" &&
                  (item.id.endsWith(".bd") ||
                    (item.domainTld && item.domainTld.endsWith("bd"))),
              ) && (
                <div className="mb-12 relative border border-blue-200 bg-blue-50/50 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                    .BD Domain Requirements
                  </span>
                  <div className="flex gap-4">
                    <div className="shrink-0 text-blue-600 bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-2">
                        BTCL Verification Needed
                      </h4>
                      <p className="text-slate-600 text-sm mb-4">
                        You are registering a Bangladesh specific domain (e.g.
                        .com.bd). BTCL requires identity verification. Please
                        send the following documents to{" "}
                        <strong>info@click2itbd.com</strong> with your Order ID,
                        or upload them in your dashboard after completing this
                        order:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1 font-medium">
                        <li>Copy of valid Trade License (For businesses)</li>
                        <li>Copy of NID (National Identity Card)</li>
                        <li>Authorization Letter (if applicable)</li>
                      </ul>
                      <p className="text-xs text-slate-500 mt-4 bg-white/60 p-3 rounded-lg">
                        Your domain will be activated once documents are
                        verified by BTCL.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 pt-4 border-t border-slate-100">
                {submitError && (
                  <div className="w-full max-w-xl p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-start gap-2.5 sm:gap-3 text-rose-800 text-xs sm:text-sm shadow-xs animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-900">
                        Order could not be placed
                      </p>
                      <p className="text-rose-700 mt-0.5 font-medium">
                        {submitError}
                      </p>
                    </div>
                  </div>
                )}

                <label className="flex items-start sm:items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-600 cursor-pointer group select-none">
                  <div className="relative flex items-center mt-0.5 sm:mt-0">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-300 rounded text-[#0E2A47] focus:ring-[#0E2A47] cursor-pointer transition-colors shrink-0"
                    />
                  </div>
                  <span className="leading-tight sm:leading-normal">
                    আমি{" "}
                    <Link
                      to="/terms"
                      className="text-[#0E2A47] font-semibold hover:underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{" "}
                    এবং Privacy Policy পড়েছি এবং সম্মত আছি
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#0E2A47] to-[#1a426e] hover:shadow-xl hover:shadow-[#0E2A47]/20 hover:-translate-y-0.5 active:scale-95 text-white font-bold py-3.5 sm:py-4 px-6 sm:px-10 rounded-xl text-sm sm:text-base md:text-lg flex items-center gap-2.5 sm:gap-3 disabled:opacity-75 disabled:hover:translate-y-0 disabled:active:scale-100 transition-all min-w-0 sm:min-w-[320px] justify-center group cursor-pointer shadow-md"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">
                        {isEmiSelected && activeEmiOption
                          ? `অর্ডার নিশ্চিত করুন — ${activeEmiOption.months} মাস EMI (৳${Math.round(activeEmiOption.monthlyInstallment).toLocaleString('en-IN')}/মাস)`
                          : paymentType === "cod"
                            ? isAdvanceCOD
                              ? `Pay Advance Delivery Fee (৳${shippingCost.toFixed(2)})`
                              : "অর্ডার নিশ্চিত করুন (Confirm Order)"
                            : `Pay Full Amount (৳${grandTotal.toFixed(2)})`}
                      </span>
                      <span className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors shrink-0">
                        <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                      </span>
                    </>
                  )}
                </button>
              </div>
        </form>
      </div>
    </Layout>
  );
};
