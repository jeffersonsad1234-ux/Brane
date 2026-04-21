import { Link } from 'react-router-dom';
import { Star, Truck, Store } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { splitPrice } from '../lib/price';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductCardAmazon({ product }) {
  const { theme } = useTheme();
  const img = product.images?.[0];
  const imgUrl = img
    ? (img.startsWith('http') ? img : `${API}/files/${img}`)
    : null;

  const { whole: priceWhole, cents: priceCents } = splitPrice(product.price);
  const rating = product.rating || (3.5 + Math.random() * 1.5);
  const ratingCount = product.rating_count || Math.floor(Math.random() * 500 + 10);
  const stars = Math.round(rating * 2) / 2;

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="group block rounded-lg border hover:shadow-lg hover:shadow-black/10 transition-all duration-300 overflow-hidden"
      style={{ backgroundColor: theme.card_bg, borderColor: theme.card_border }}
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden flex items-center justify-center p-3" style={{ backgroundColor: theme.card_bg }}>
        {imgUrl ? (
          <img src={imgUrl} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50"><Store className="w-10 h-10 text-gray-300" /></div>
        )}
        {product.product_type === 'secondhand' && <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">USADO</span>}
        {product.product_type === 'unique' && <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">UNICO</span>}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-1">
        <h3 className="text-[13px] leading-tight line-clamp-2 mb-1 group-hover:text-[#C7511F] transition-colors" style={{ color: theme.price_color }}>
          {product.title}
        </h3>

        {/* Stars */}
        {theme.show_stars && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-3 h-3" style={{ fill: i <= stars ? theme.star_color : '#E0E0E0', color: i <= stars ? theme.star_color : '#E0E0E0' }} />
              ))}
            </div>
            <span className="text-[11px] text-[#007185]">({ratingCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-1">
          <span className="text-[11px] text-[#565959]">R$ </span>
          <span className="text-[22px] font-bold leading-none" style={{ color: theme.price_color }}>{priceWhole}</span>
          <span className="text-[12px] align-super font-bold" style={{ color: theme.price_cents_color }}>,{priceCents}</span>
        </div>

        {/* Free delivery */}
        {theme.show_free_shipping && (
          <div className="flex items-center gap-1 mb-1">
            <Truck className="w-3 h-3 text-[#565959]" />
            <span className="text-[11px] text-[#565959]">Frete <span className="font-bold" style={{ color: theme.free_shipping_color }}>GRATIS</span></span>
          </div>
        )}

        <p className="text-[10px] text-[#565959]">por {product.seller_name || 'Vendedor BRANE'}</p>

        {product.category && (
          <span className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[#F0F2F2] text-[#565959] border border-[#D5D9D9]">
            {product.category}
          </span>
        )}
      </div>
    </Link>
  );
}
