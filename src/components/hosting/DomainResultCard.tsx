import React from 'react';
import { CheckCircle2, XCircle, ShoppingCart } from 'lucide-react';
import { DomainAvailabilityResult, DomainPricing } from '../../services/hostingApi';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DomainResultCardProps {
  result: DomainAvailabilityResult;
  pricing: DomainPricing | undefined;
  onSearchAlternative: (domain: string) => void;
}

export const DomainResultCard: React.FC<DomainResultCardProps> = ({ result, pricing, onSearchAlternative }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    const tld = result.domain.split('.').pop() || '';
    const product = {
      id: `domain_${result.domain}`,
      name: `Domain Registration - ${result.domain}`,
      description: '1 Year Registration',
      price: result.price || pricing?.registerPrice || 1000,
      category: 'Hosting & Domains',
      stock: 9999,
      images: [],
      createdAt: new Date().toISOString(),
      itemType: 'domain' as const,
      domainTld: tld,
      termYears: 1,
    };
    addToCart(product as any);
    toast.success(`Domain ${result.domain} added to cart`);
    navigate('/hosting/cart');
  };

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5 ${result.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {result.available ? (
            <CheckCircle2 className="text-green-600" size={20} />
          ) : (
            <XCircle className="text-red-600" size={20} />
          )}
          <span className="font-bold text-lg">{result.domain}</span>
        </div>
        <div className="text-sm text-gray-600">
          {result.available ? (
            <span className="text-green-700 font-medium">
              Available — {pricing?.currency || 'BDT'} {result.price || pricing?.registerPrice || 1000}/yr
            </span>
          ) : (
            <span className="text-red-700">Already registered</span>
          )}
        </div>
      </div>
      {result.available && (
        <button
          onClick={handleAddToCart}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c2i-red)] focus-visible:ring-offset-2"
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
      )}
    </div>
  );
};
