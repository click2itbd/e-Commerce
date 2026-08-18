import React from 'react';
import { CheckCircle2, XCircle, ShoppingCart } from 'lucide-react';
import { DomainAvailabilityResult, DomainPricing } from '../../services/hostingApi';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

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

  const isAvailable = result.available;
  const baseName = result.domain.substring(0, result.domain.lastIndexOf('.'));
  const tld = result.domain.substring(result.domain.lastIndexOf('.'));
  const price = result.price || pricing?.registerPrice || 1000;
  const currency = pricing?.currency || 'BDT';

  return (
    <div 
      className={cn(
        "p-5 rounded-2xl border flex items-center justify-between transition-all duration-300",
        isAvailable 
          ? "bg-[#0b1b16] border-green-500/30 shadow-[0_4px_30px_rgba(34,197,94,0.05)]" 
          : "bg-[#1b0b0b] border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.05)]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border",
          isAvailable 
            ? "bg-green-500/10 border-green-500/50" 
            : "bg-red-500/10 border-red-500/50"
        )}>
          {isAvailable ? (
            <CheckCircle2 className="text-green-500 shadow-green-500/50 drop-shadow-lg" size={24} />
          ) : (
            <XCircle className="text-red-500 shadow-red-500/50 drop-shadow-lg" size={24} />
          )}
        </div>
        
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-semibold text-xl text-gray-200">{baseName}</span>
            <span className="font-bold text-xl text-white">{tld}</span>
          </div>
          <div className="text-sm">
            {isAvailable ? (
              <span className="text-green-400 font-medium tracking-wide">is available!</span>
            ) : (
              <span className="text-red-400 font-medium tracking-wide">already taken</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {isAvailable && (
          <div className="text-right">
            <div className="font-bold text-xl text-white">{currency} {price.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            <div className="text-xs text-gray-500">/year</div>
          </div>
        )}
        
        {isAvailable && (
          <button
            onClick={handleAddToCart}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
          >
            <ShoppingCart size={18} /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};
