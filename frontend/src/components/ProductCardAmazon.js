import { Link } from 'react-router-dom';
import { Star, Truck, Store } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductCardAmazon({ product }) {
  const img = product.images?.[0];
  const imgUrl = img
    ? (img.startsWith('http') ? img : `${API}/files/${img}`)
    : null;

  // Format price Amazon-style: R$ 23,99
  const priceWhole = Math.floor(product.price || 0);
  const priceCents = Math.round(((product.price || 0) - priceWhole) * 100).toString().padStart(2, '0');

  // Random rating for display (in a real app, this would come from the backend)
  const rating = product.rating || (3.5 + Math.random() * 1.5);
  const ratingCount = product.rating_count || Math.floor(Math.random() * 500 + 10);
  const stars = Math.round(rating * 2) / 2;

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="group block bg-white rounded-lg border border-[#E0E0E0] hover:shadow-lg hover:shadow-black/10 transition-all duration-300 overflow-hidden"
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Image - Compact */}
      <div className="relative bg-white aspect-[4/3] overflow-hidden flex items-center justify-center p-3">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.title}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Store className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* Badges */}
        {product.product_type === 'secondhand' && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">USADO</span>
        )}
        {product.product_type === 'unique' && (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">UNICO</span>
        )}
      </div>

      {/* Product Info */}
      <div className="px-3 pb-3 pt-1">
        {/* Title */}
        <h3 className="text-[13px] text-[#0F1111] leading-tight line-clamp-2 mb-1 group-hover:text-[#C7511F] transition-colors">
          {product.title}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= stars ? 'fill-[#FFA41C] text-[#FFA41C]' : i - 0.5 <= stars ? 'fill-[#FFA41C]/50 text-[#FFA41C]' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#007185]">({ratingCount})</span>
        </div>

        {/* Price - Amazon style */}
        <div className="mb-1">
          <span className="text-[11px] text-[#565959]">R$ </span>
          <span className="text-[22px] font-bold text-[#0F1111] leading-none">{priceWhole}</span>
          <span className="text-[12px] text-[#0F1111] align-super font-bold">,{priceCents}</span>
        </div>

        {/* Free delivery */}
        <div className="flex items-center gap-1 mb-1">
          <Truck className="w-3 h-3 text-[#565959]" />
          <span className="text-[11px] text-[#565959]">Frete <span className="font-bold text-[#0F1111]">GRATIS</span> no primeiro pedido</span>
        </div>

        {/* Seller */}
        <p className="text-[10px] text-[#565959]">por {product.seller_name || 'Vendedor BRANE'}</p>

        {/* Category badge */}
        {product.category && (
          <span className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[#F0F2F2] text-[#565959] border border-[#D5D9D9]">
            {product.category}
          </span>
        )}
      </div>
    </Link>
  );
}
