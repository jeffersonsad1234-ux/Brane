import { Link } from 'react-router-dom';
import { Store, MapPin, Clock, MessageCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Card de loja estilo Instagram com produtos em destaque
 */
export default function StoreCard({ store }) {
  const logoUrl = store.logo 
    ? (store.logo.startsWith('http') ? store.logo : `${API}/files/${store.logo}`)
    : null;
  
  const bannerUrl = store.banner
    ? (store.banner.startsWith('http') ? store.banner : `${API}/files/${store.banner}`)
    : null;

  // Pegar os primeiros produtos em destaque
  const featuredProducts = store.featured_products || [];

  return (
    <div className="bg-gradient-to-br from-[#0E0F14] to-[#1A1C26] rounded-2xl overflow-hidden border border-[#D4A24C]/20 hover:border-[#D4A24C]/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#D4A24C]/10">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-[#1A1C26] to-[#0E0F14]">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt={store.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-12 h-12 text-[#D4A24C]/30" />
          </div>
        )}
        
        {/* Logo sobreposto */}
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#050608] bg-gradient-to-br from-[#1A1C26] to-[#0E0F14] overflow-hidden shadow-xl">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={store.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-8 h-8 text-[#D4A24C]" />
              </div>
            )}
          </div>
        </div>

        {/* Badge do plano */}
        {store.plan !== 'free' && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
            store.plan === 'premium' 
              ? 'bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            {store.plan.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info da Loja */}
      <div className="pt-12 px-6 pb-4">
        <Link 
          to={`/stores/${store.store_id}`}
          className="block"
        >
          <h3 className="text-xl font-bold text-white hover:text-[#D4A24C] transition-colors mb-1">
            {store.name}
          </h3>
        </Link>
        
        {store.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {store.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          {store.category && (
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3" />
              {store.category}
            </span>
          )}
          {store.business_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {store.business_hours}
            </span>
          )}
        </div>

        {/* Produtos em Destaque - Grid 2x2 */}
        {featuredProducts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[#D4A24C] mb-2 uppercase tracking-wide">
              Produtos em Destaque
            </p>
            <div className="grid grid-cols-2 gap-2">
              {featuredProducts.slice(0, 4).map((product, idx) => (
                <Link
                  key={idx}
                  to={`/products/${product.product_id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-[#0E0F14] border border-gray-800 hover:border-[#D4A24C] transition-all"
                >
                  {product.image ? (
                    <img 
                      src={product.image.startsWith('http') ? product.image : `${API}/files/${product.image}`}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-700" />
                    </div>
                  )}
                  
                  {/* Overlay com preço */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-xs font-bold text-white">
                      R$ {product.price?.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Link
            to={`/stores/${store.store_id}`}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white text-sm font-semibold rounded-lg hover:from-[#E8C372] hover:to-[#D4A24C] transition-all text-center"
          >
            Ver Loja
          </Link>
          <Link
            to={`/stores/${store.store_id}/chat`}
            className="px-4 py-2 bg-[#1A1C26] text-gray-300 rounded-lg hover:bg-[#2A2C36] hover:text-[#D4A24C] transition-all border border-gray-700 hover:border-[#D4A24C]"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
