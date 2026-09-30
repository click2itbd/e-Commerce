import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Product } from "../../types";
import { ProductCard } from "../../components/ProductCard";
import { Layout } from "../../components/Layout";
import { SEO } from "../../components/SEO";
import { PageLoader } from "../../components/Loading";

export const CampaignLanding: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignProducts = async () => {
      try {
        setLoading(true);
        // Try to fetch products tagged with 'facebook'
        const fbQuery = query(
          collection(db, "products"),
          where("isExclusiveDeal", "==", true),
          limit(20)
        );
        let querySnapshot = await getDocs(fbQuery);
        let fetchedProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // If no products found with 'facebook' tag, fallback to recent products for demo purposes
        if (fetchedProducts.length === 0) {
          const recentQuery = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
            limit(12)
          );
          querySnapshot = await getDocs(recentQuery);
          fetchedProducts = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
        }

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching campaign products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignProducts();
  }, []);

  return (
    <Layout>
      <SEO
        title="Exclusive Facebook Offers"
        description="Check out our exclusive products from Facebook posts and promotions."
      />
      
      {/* Campaign Banner */}
      <section className="relative overflow-hidden rounded-2xl shadow-lg mb-10 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 320"><path fill="#ffffff" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,170.7C672,149,768,107,864,117.3C960,128,1056,192,1152,202.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>
        <div className="relative p-10 md:p-16 flex flex-col items-center text-center z-10 text-white">
          <h1 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-md">
            Exclusive Deals
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-blue-100 font-medium">
            Welcome! Explore our special handpicked products. Grab them before stock runs out!
          </p>
        </div>
      </section>

      {/* Product Listing */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
          <h2 className="text-2xl font-bold text-[#081621] relative after:content-[''] after:absolute after:-bottom-[11px] after:left-0 after:w-16 after:h-1 after:bg-[#F97316]">
            Featured Products for You
          </h2>
        </div>

        {loading ? (
          <PageLoader />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">
              No exclusive products found right now. Check back later!
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};
