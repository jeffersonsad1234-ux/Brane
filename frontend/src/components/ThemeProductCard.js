import { Link } from 'react-router-dom';
import { Heart, MapPin, Store as StoreIcon, Star } from 'lucide-react';
import { splitPrice } from '../lib/price';
import { useTheme } from '../contexts/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Theme-aware Product Card.
 * Shape, size, image ratio, colors and visible elements are fully controlled by admin theme.
 */
export default function ThemeProductCard({ product }) {
  const { theme } = useTheme() || { theme: {} };
  const imgUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API}/files/${product.images[0]}`)
    : null;
  const { whole, cents } = splitPrice(product.price);
  const showStars = theme.show_stars !== false;
  const showInstallments = theme.show_installments !== false;
  const showFreeShipping = theme.show_free_shipping !== false;

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="theme-product-card group block"
      data-testid={`product-card-${product.product_id}`}
    >
      <div className="theme-product-image">
        {imgUrl ? (
          <img src={imgUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><StoreIcon className="w-10 h-10 text-white/20" /></div>
        )}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70 hover:text-[#6D28D9] transition"
          onClick={e => { e.preventDefault(); }}
          aria-label="Favoritar"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="theme-product-body">
        <h3 className="theme-product-title line-clamp-2">{product.title}</h3>

        {showStars && (
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-3 h-3" style={{ color: 'var(--star-color)', fill: 'var(--star-color)' }} />
            ))}
          </div>
        )}

        <div className="flex items-baseline gap-0.5">
          <span style={{ color: 'var(--price-color)', fontSize: '11px', fontWeight: 600 }}>R$</span>
          <span className="theme-product-price">{whole}</span>
          <span className="theme-product-cents">,{cents}</span>
        </div>

        {showInstallments && theme.installment_count > 1 && (
          <p className="text-[11px] text-[#A6A8B3]">
            em até {theme.installment_count}x de R$ {(product.price / theme.installment_count).toFixed(2).replace('.', ',')}
          </p>
        )}

        {showFreeShipping && product.free_shipping && (
          <p className="text-[11px] font-semibold" style={{ color: 'var(--free-shipping-color)' }}>Frete grátis</p>
        )}

        {product.city && (
          <div className="flex items-center gap-1 text-[11px] text-[#6F7280] mt-auto">
            <MapPin className="w-3 h-3" /> {product.city}
          </div>
        )}
      </div>
    </Link>
  );
}
