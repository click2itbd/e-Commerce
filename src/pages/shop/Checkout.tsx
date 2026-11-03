// @ts-nocheck
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { Layout } from "../../components/Layout";
import { toast } from "react-hot-toast";
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, Loader2, MapPin, CheckCircle2, Plus } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { generatePDF } from "../../lib/pdf";
import { initiateEpsPayment } from "../../services/paymentApi";
import { apiPost } from "../../services/apiClient";

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

  let shippingCost = 0;
  if (formData.state && formData.city) {
    if (
      (formData.state === "Dhaka" && formData.city === "Dhaka") ||
      formData.state === "Dhaka"
    ) {
      shippingCost = shippingConfig.insideDhaka;
    } else {
      shippingCost = shippingConfig.outsideDhaka;
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
  const isAdvanceCOD = paymentType === "cod" && shippingCost > 0;
  const grandTotal = total + shippingCost;

  const [geoData, setGeoData] = useState({
    divisions: [],
    districts: [],
    upazilas: [],
    unions: [],
  });
  const [activeGeo, setActiveGeo] = useState({
    districts: [],
    upazilas: [],
    unions: [],
  });

  React.useEffect(() => {
    fetch("/data/bd-geo.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load geo data", err));
  }, []);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);
  const [saveAddressToBook, setSaveAddressToBook] = useState(true);

  const applyAddressToForm = (addr: any, currentGeoData = geoData) => {
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

    const addrState = addr.state || "";
    const addrCity = addr.city || "";
    const addrThana = addr.thana || "";

    if (currentGeoData?.divisions && currentGeoData.divisions.length > 0) {
      let matchedDiv = currentGeoData.divisions.find(
        (d: any) => d.name.toLowerCase() === addrState.toLowerCase()
      );

      let matchedDist: any = null;
      if (addrCity && currentGeoData.districts) {
        matchedDist = currentGeoData.districts.find(
          (d: any) => d.name.toLowerCase() === addrCity.toLowerCase()
        );
        if (!matchedDiv && matchedDist) {
          matchedDiv = currentGeoData.divisions.find(
            (div: any) => div.id === matchedDist.div_id
          );
        }
      }

      const filteredDistricts = matchedDiv
        ? currentGeoData.districts.filter((d: any) => d.div_id === matchedDiv.id)
        : [];

      const filteredUpazilas = matchedDist
        ? currentGeoData.upazilas.filter((u: any) => u.dist_id === matchedDist.id)
        : [];

      let matchedUpz: any = null;
      if (addrThana && filteredUpazilas.length > 0) {
        matchedUpz = filteredUpazilas.find(
          (u: any) => u.name.toLowerCase() === addrThana.toLowerCase()
        );
      }
      const filteredUnions = matchedUpz
        ? (currentGeoData.unions || []).filter(
            (un: any) => un.upz_id === matchedUpz.id
          )
        : [];

      setActiveGeo({
        districts: filteredDistricts,
        upazilas: filteredUpazilas,
        unions: filteredUnions,
      });

      setFormData((prev) => ({
        ...prev,
        firstName: fName || prev.firstName,
        lastName: lName || prev.lastName,
        phone: cleanPhone || prev.phone,
        address1: addr.address || prev.address1,
        state: matchedDiv?.name || addrState || prev.state,
        city: matchedDist?.name || addrCity || prev.city,
        thana: matchedUpz?.name || addrThana || prev.thana,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        firstName: fName || prev.firstName,
        lastName: lName || prev.lastName,
        phone: cleanPhone || prev.phone,
        address1: addr.address || prev.address1,
        state: addrState || prev.state,
        city: addrCity || prev.city,
        thana: addrThana || prev.thana,
      }));
    }
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

  React.useEffect(() => {
    if (
      selectedAddressIndex !== null &&
      savedAddresses[selectedAddressIndex] &&
      geoData.divisions.length > 0
    ) {
      applyAddressToForm(savedAddresses[selectedAddressIndex], geoData);
    }
  }, [geoData, selectedAddressIndex]);

  const handleGeoChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    if (name === "state") {
      const selectedDiv = geoData.divisions.find((d) => d.name === value);
      const filteredDistricts = selectedDiv
        ? geoData.districts.filter((d) => d.div_id === selectedDiv.id)
        : [];
      setActiveGeo((prev) => ({
        ...prev,
        districts: filteredDistricts,
        upazilas: [],
        unions: [],
      }));
      newData = { ...newData, city: "", thana: "", union: "" };
    } else if (name === "city") {
      const selectedDist = activeGeo.districts.find((d) => d.name === value);
      const filteredUpazilas = selectedDist
        ? geoData.upazilas.filter((u) => u.dist_id === selectedDist.id)
        : [];
      setActiveGeo((prev) => ({
        ...prev,
        upazilas: filteredUpazilas,
        unions: [],
      }));
      newData = { ...newData, thana: "", union: "" };
    } else if (name === "thana") {
      const selectedUpz = activeGeo.upazilas.find((u) => u.name === value);
      const filteredUnions = selectedUpz
        ? geoData.unions.filter((u) => u.upz_id === selectedUpz.id)
        : [];
      setActiveGeo((prev) => ({ ...prev, unions: filteredUnions }));
      newData = { ...newData, union: "" };
    }

    setFormData(newData);
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

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.termsAccepted) {
      toast.error("You must agree to the Terms of Service.");
      return;
    }

    setIsProcessing(true);

    try {
      if (!user && formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setIsProcessing(false);
          return;
        }
        try {
          await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password,
          );
        } catch (error: any) {
          toast.error(error.message);
          setIsProcessing(false);
          return;
        }
      } else if (!user) {
        toast.error(
          "Please login, sign in with Google or create a password to checkout.",
        );
        setIsProcessing(false);
        return;
      }

      const cleanPhone = formData.phone
        .replace(/\D/g, "")
        .replace(/^(?:880|88)?0?/, "");
      const phoneRegex = /^1[3-9]\d{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        toast.error(
          "Please enter a valid 10-digit phone number starting with 1 (e.g. 17XXXXXXXX).",
        );
        setIsProcessing(false);
        return;
      }
      const fullPhone = `+880${cleanPhone}`;

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

      const currentAuthUser = auth.currentUser || user;
      if (!currentAuthUser) {
        toast.error("Authentication required to place an order.");
        setIsProcessing(false);
        return;
      }
      const token = await currentAuthUser.getIdToken();

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

      const createRes = await apiPost(
        "/api/orders/create",
        {
          platform: "ecommerce",
          items: minimalItems,
          couponCode: appliedDiscount ? appliedDiscount.code : null,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          customerEmail: formData.email,
          customerPhone: fullPhone,
          shippingAddress: `${formData.address1}, ${formData.address2 ? formData.address2 + ", " : ""}${formData.union ? formData.union + ", " : ""}${formData.thana ? formData.thana + ", " : ""}${formData.city}, ${formData.state} - ${formData.postcode}, ${formData.country}`,
          city: formData.city,
          state: formData.state,
          company: formData.company,
          paymentType,
          advanceDelivery: isAdvanceCOD,
          paymentMethod:
            paymentType === "cod"
              ? isAdvanceCOD
                ? "cod_advance_paid"
                : "cod"
              : "eps",
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

      if (user && saveAddressToBook) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const fullName = `${formData.firstName} ${formData.lastName}`.trim();
          const newAddrItem = {
            id: Date.now().toString(),
            type: "Home",
            name: fullName,
            phone: fullPhone,
            state: formData.state,
            city: formData.city,
            thana: formData.thana,
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
          throw new Error("Failed to initiate EPS Payment Gateway.");
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
      const msg = error.message || "Failed to place order";
      toast.error(msg);
      setSubmitError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12 mb-20 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Checkout
            </h1>
            <p className="text-slate-500 text-base mt-2">
              Please enter your personal details and billing information to
              complete your order.
            </p>
          </div>
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-6 py-2.5 text-slate-700 font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              Already Registered? Login
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100"
        >
          {!user && (
            <div className="mb-12 relative border-t border-slate-200 pt-8 mt-4">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                Sign Up
              </span>
              <p className="text-center text-slate-500 mb-6">
                Save time by signing up using an existing account.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex flex-row items-center justify-center gap-3 border border-slate-200 rounded-xl px-8 py-3 hover:bg-slate-50 bg-white shadow-sm transition-all text-sm font-bold text-slate-700 hover:-translate-y-0.5"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {/* Saved Addresses Section */}
          {user && savedAddresses.length >= 2 && (
            <div className="mb-10 bg-slate-50/70 rounded-2xl border-2 border-slate-200 p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0E2A47] text-white flex items-center justify-center text-sm shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Select Delivery Address</h3>
                    <p className="text-xs text-slate-500">Choose from your saved addresses to autofill</p>
                  </div>
                </div>
                <Link
                  to="/profile?tab=profile"
                  target="_blank"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Address Book
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {savedAddresses.map((addr, idx) => {
                  const isSelected = selectedAddressIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedAddressIndex(idx);
                        applyAddressToForm(addr, geoData);
                        toast.success(`Selected "${addr.type || 'Address ' + (idx + 1)}"`);
                      }}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-[#0E2A47] bg-[#0E2A47]/5 shadow-sm ring-2 ring-[#0E2A47]/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isSelected ? "bg-[#0E2A47] text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            {addr.type || "Address"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-[#0E2A47]" : "border-slate-300"
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#0E2A47]" />}
                            </div>
                          </div>
                        </div>

                        <p className="font-bold text-slate-900 text-sm">{addr.name}</p>
                        <p className="text-xs text-slate-500 mb-1">{addr.phone}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {addr.address}{addr.thana ? `, ${addr.thana}` : ''}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div
                  onClick={() => {
                    setSelectedAddressIndex(-1);
                    setFormData((prev) => ({
                      ...prev,
                      firstName: "",
                      lastName: "",
                      phone: "",
                      address1: "",
                      address2: "",
                      state: "",
                      city: "",
                      thana: "",
                      union: "",
                    }));
                    setActiveGeo({ districts: [], upazilas: [], unions: [] });
                    toast("Please enter your new address below", { icon: "✏️" });
                  }}
                  className={`cursor-pointer rounded-xl p-4 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center py-6 ${
                    selectedAddressIndex === -1
                      ? "border-[#0E2A47] bg-[#0E2A47]/5 ring-2 ring-[#0E2A47]/20"
                      : "border-slate-300 hover:border-slate-400 bg-white"
                  }`}
                >
                  <Plus size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Enter a Different Address</span>
                  <span className="text-[11px] text-slate-400">Fill in new details manually</span>
                </div>
              </div>
            </div>
          )}

          {user && savedAddresses.length === 1 && (
            <div className="mb-6 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                Autofilled from your saved <strong>{savedAddresses[0].type || "Home"}</strong> address ({savedAddresses[0].name}).
              </span>
              <Link to="/profile?tab=profile" target="_blank" className="font-bold text-emerald-700 hover:underline shrink-0 ml-2">
                Manage Address Book →
              </Link>
            </div>
          )}

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
              Personal Information
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name *"
                required
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name *"
                required
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address *"
                required
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <div className="flex">
                <span className="inline-flex items-center px-4 border border-r-0 border-slate-200 bg-slate-100 text-slate-600 font-medium text-sm rounded-l-xl">
                  <img
                    src="https://flagcdn.com/w20/bd.png"
                    alt="BD"
                    className="w-5 h-auto mr-2 rounded-sm shadow-sm"
                  />{" "}
                  +880
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="1XXXXXXXXX *"
                  maxLength={10}
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-r-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all flex-1"
                />
              </div>
            </div>
          </div>

          <div className="mb-12 relative border-t border-slate-200 pt-8">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
              Billing Address
            </span>
            <div className="space-y-5">
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company Name (Optional)"
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                placeholder="Street Address *"
                required
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleChange}
                placeholder="Apartment, suite, etc. (Optional)"
                className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleGeoChange}
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-700"
                >
                  <option value="" disabled>
                    Select Division *
                  </option>
                  {geoData.divisions.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  name="city"
                  value={formData.city}
                  onChange={handleGeoChange}
                  required
                  disabled={!formData.state}
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    Select District/City *
                  </option>
                  {activeGeo.districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <select
                  name="thana"
                  value={formData.thana}
                  onChange={handleGeoChange}
                  required
                  disabled={!formData.city}
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    Select Thana / Upazila *
                  </option>
                  {activeGeo.upazilas.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  name="union"
                  value={formData.union}
                  onChange={handleGeoChange}
                  disabled={!formData.thana || activeGeo.unions.length === 0}
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {activeGeo.unions.length === 0
                      ? "No Union (Optional)"
                      : "Select Union / Area (Optional)"}
                  </option>
                  {activeGeo.unions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  placeholder="Postcode / ZIP *"
                  required
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
                />

                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
                >
                  <option value="Bangladesh">Bangladesh</option>
                </select>
              </div>

              {user && (
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="saveAddressToBook"
                    name="saveAddressToBook"
                    checked={saveAddressToBook}
                    onChange={(e) => setSaveAddressToBook(e.target.checked)}
                    className="w-4 h-4 text-[#0E2A47] rounded border-slate-300 focus:ring-[#0E2A47]"
                  />
                  <label htmlFor="saveAddressToBook" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Save / update this address in my Address Book for future checkouts
                  </label>
                </div>
              )}

              <div className="mb-12 relative border-t border-slate-200 pt-8">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                  Additional Information
                </span>
                <div className="max-w-xs mx-auto text-center">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    How did you find us?
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all text-center"
                  >
                    <option value="None">Please Select...</option>
                    <option value="Google">Google Search</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Friend">Friend / Recommendation</option>
                  </select>
                </div>
              </div>

              {items.some((item) => item.itemType === "domain") && (
                <div className="mb-10 relative border-t border-slate-200 pt-8">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                    Domain Registrant Information
                  </span>
                  <p className="text-sm text-slate-500 mb-6 text-center max-w-2xl mx-auto">
                    You may specify alternative registered contact details for
                    the domain registration(s) in your order when placing an
                    order on behalf of another person or entity.
                  </p>
                  <div className="flex justify-center">
                    <select
                      name="domainContact"
                      value={formData.domainContact}
                      onChange={handleChange}
                      className="border border-slate-200 p-3 rounded-xl text-sm min-w-[300px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
                    >
                      <option value="default">
                        Use Default Contact (Details Above)
                      </option>
                      <option value="custom">Add New Contact</option>
                    </select>
                  </div>
                </div>
              )}

              {!user && (
                <div className="mb-12 relative border-t border-slate-200 pt-8">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                    Account Security
                  </span>
                  <p className="text-center text-sm text-slate-500 mb-6">
                    Create a password to easily access your orders and track
                    status.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#0E2A47] transition-colors" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password *"
                        required
                        className="border border-slate-200 bg-slate-50/50 p-3.5 pl-11 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-[#0E2A47] transition-colors" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password *"
                        required
                        className="border border-slate-200 bg-slate-50/50 p-3.5 pl-11 rounded-xl text-sm w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Generate Password
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Password Strength:</span>
                      <span
                        className={`font-semibold ${formData.password.length > 8 ? "text-emerald-500" : formData.password.length > 0 ? "text-amber-500" : "text-slate-400"}`}
                      >
                        {formData.password.length > 8
                          ? "Strong"
                          : formData.password.length > 0
                            ? "Weak"
                            : "Enter Password"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-12 relative border-t border-slate-200 pt-8">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                  Payment Details
                </span>

                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mb-8">
                  <div className="space-y-3 max-w-sm mx-auto">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        ৳ {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                      <span>Shipping:</span>
                      <span className="font-semibold">
                        ৳ {shippingCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 pt-1">
                      <span className="font-bold text-lg">Total Due:</span>
                      <span className="font-black text-xl text-[#6EC72A]">
                        ৳ {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-slate-600 font-medium mb-6">
                  Select Payment Method
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                  {/* Option 1: Cash on Delivery */}
                  <div
                    onClick={() => setPaymentType("cod")}
                    className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all flex items-center gap-3 ${
                      paymentType === "cod"
                        ? "border-[#0E2A47] bg-[#0E2A47]/5 shadow-sm ring-1 ring-[#0E2A47]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentType === "cod" ? "border-[#0E2A47]" : "border-slate-400"}`}
                    >
                      {paymentType === "cod" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0E2A47]" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900 text-base">
                      Cash on Delivery
                    </span>
                  </div>

                  {/* Option 2: Pay Now */}
                  <div
                    onClick={() => setPaymentType("pay_now")}
                    className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all flex items-center gap-3 ${
                      paymentType === "pay_now"
                        ? "border-[#0E2A47] bg-[#0E2A47]/5 shadow-sm ring-1 ring-[#0E2A47]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentType === "pay_now" ? "border-[#0E2A47]" : "border-slate-400"}`}
                    >
                      {paymentType === "pay_now" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0E2A47]" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900 text-base">
                      Pay Now
                    </span>
                  </div>
                </div>
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

              <div className="mb-12 relative border-t border-slate-200 pt-8">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1 rounded-full text-slate-800 text-sm font-semibold border border-slate-100 shadow-sm">
                  Additional Notes
                </span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes, delivery instructions, or special requests..."
                  rows={4}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-4 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all resize-y"
                ></textarea>
              </div>

              <div className="flex flex-col items-center justify-center gap-6 pt-4 border-t border-slate-100">
                {submitError && (
                  <div className="w-full max-w-xl p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm shadow-sm animate-in fade-in duration-200">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
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

                <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="w-5 h-5 border-2 border-slate-300 rounded text-[#0E2A47] focus:ring-[#0E2A47] cursor-pointer transition-colors"
                    />
                  </div>
                  <span>
                    I have read and agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-[#0E2A47] font-semibold hover:underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{" "}
                    & Privacy Policy
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-[#0E2A47] to-[#1a426e] hover:shadow-xl hover:shadow-[#0E2A47]/20 hover:-translate-y-0.5 active:scale-95 text-white font-bold py-4 px-10 rounded-xl text-lg flex items-center gap-3 disabled:opacity-75 disabled:hover:translate-y-0 disabled:active:scale-100 transition-all min-w-[320px] justify-center group cursor-pointer shadow-md"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentType === "cod"
                          ? shippingCost > 0
                            ? `Pay Advance Delivery Fee (৳${shippingCost.toFixed(2)})`
                            : "Confirm Cash on Delivery Order"
                          : `Pay Full Amount (৳${grandTotal.toFixed(2)})`}
                      </span>
                      <span className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                        <ArrowRight size={20} />
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};
