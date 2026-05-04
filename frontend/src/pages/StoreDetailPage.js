import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Store,
  Star,
  Crown,
  Zap,
  Package,
  MapPin,
  ArrowLeft,
  Copy,
  Share2,
  MessageCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PLAN_BADGES = {
  premium: { label: 'PREMIUM', color: '#D4A24C', icon: Crown, bg: 'from-[#D4A24C]/20 to-[#D4A24C]/5' },
  gold: { label: 'GOLD', color: '#D4A24C', icon: Crown, bg: 'from-[#D4A24C]/20 to-[#D4A24C]/5' },
  pro: { label: 'PRO', color: '#3B82F6', icon: Zap, bg: 'from-[#3B82F6]/20 to-[#3B82F6]/5' },
  free: { label: '', color: '#666', icon: Store, bg: 'from-[#666]/20 to-[#666]/5' }
};

function getImageUrl(product) {
  const img =
    product.image ||
    product.image_url ||
    product.thumbnail ||
    product.cover ||
    (product.images && product.images.length ? product.images[0] : null);

  if (!img) return null;

  if (img.startsWith('http') || img.startsWith('data:image')) {
    return img;
  }

  return API + '/files/' + img;
}

function isDesapegaProduct(product) {
  return (
    product.product_type === 'secondhand' ||
    product.product_type === 'desapega' ||
    product.listing_type === 'desapega' ||
    product.source === 'desapega'
  );
}

function ProductCard({ product }) {
  const imgUrl = getImageUrl(product);

  return (
    <Link to={'/products/' + product.product_id} className="group block">
      <div className="relative bg-transparent border border-[#1E2230] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#D4A24C]/50 hover:shadow-xl hover:shadow-[#D4A24C]/10 hover:-translate-y-2">
        <div className="aspect-square bg-white relative overflow-hidden">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm text-[#8B7355] line-clamp-2 mb-1 group-hover:text-[#D4A24C] transition-colors">
            {product.title}
          </h3>

          {product.city && (
            <p className="text-xs text-[#6F7280] mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4A7C9B]" />
              {product.city}
            </p>
          )}

          <p className="text-xl font-bold bg-gradient-to-r from-[#D4A24C] to-[#D4A84B] bg-clip-text text-transparent">
            R$ {Number(product.price || 0).toFixed(2)}
          </p>

          <div className="mt-3 text-center text-xs font-semibold text-white bg-[#D4A24C] rounded-lg py-2">
            Comprar
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StoreDetailPage() {
  const { slug } = useParams();
 const { user, token } = useAuth()
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const headers = token ? { Authorization: 'Bearer ' + token } : {};

  const url =
    slug === 'my' || slug === 'minha-loja'
      ? API + '/stores/my'
      : API + '/stores/' + slug;

  axios.get(url, { headers })
    .then((res) => {
      setStore(res.data.store || res.data);
    })
    .catch(() => {
      setStore(null);
    })
    .finally(() => setLoading(false));
}, [slug, token]);
  if (loading) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen carbon-bg flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-[#6F7280] mx-auto mb-4" />
          <p className="text-[#A6A8B3] mb-4">Loja não encontrada</p>
          <Link to="/stores">
            <Button className="gold-btn rounded-lg">Ver Lojas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = store.logo
    ? (store.logo.startsWith('http') ? store.logo : API + '/files/' + store.logo)
    : null;

const bannerImage =
  store.banner ||
  store.cover ||
  store.cover_image ||
  store.banner_url ||
  store.background ||
  store.background_image ||
  store.image_banner ||
  '';

const bannerUrl = bannerImage
  ? (
      bannerImage.startsWith('http') ||
      bannerImage.startsWith('data:image')
    )
    ? bannerImage
    : API + '/files/' + bannerImage
  : null;

  const badge = PLAN_BADGES[store.plan] || PLAN_BADGES.free;
  const BadgeIcon = badge.icon;

  const storeProducts = (store.products || []).filter((product) => {
    if (!product) return false;
    if (isDesapegaProduct(product)) return false;
    return true;
  });

  return (
    <div className="min-h-screen carbon-bg" data-testid="store-detail-page">
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[#0B0D12] to-[#0D0D0D]">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4A24C]/20 via-[#3B82F6]/10 to-[#D4A24C]/20" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />

        <Link
          to="/stores"
          className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 px-3 py-2 rounded-lg backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#11131A] border-4 border-[#0D0D0D] overflow-hidden shadow-2xl shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className={'w-full h-full flex items-center justify-center bg-gradient-to-br ' + badge.bg}>
                <Store className="w-12 h-12" style={{ color: badge.color }} />
              </div>
            )}
          </div>

          <div className="flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{store.name}</h1>

              {badge.label && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: badge.color + '20',
                    color: badge.color,
                    border: '1px solid ' + badge.color + '40'
                  }}
                >
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>

            {store.description && (
              <p className="text-[#A6A8B3] mb-4 max-w-2xl">{store.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-[#A6A8B3]">
                <Package className="w-4 h-4 text-[#D4A24C]" />
                <span className="text-white font-medium">{storeProducts.length}</span> produtos
              </span>

              <span className="flex items-center gap-2 text-[#A6A8B3]">
                <Store className="w-4 h-4 text-[#D4A24C]" />
                <span className="text-white font-medium">{store.total_sales || 0}</span> vendas
              </span>

              {store.rating > 0 && (
                <span className="flex items-center gap-2 text-[#A6A8B3]">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-white font-medium">{store.rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-5">
              <Link
                to={'/stores/' + store.store_id + '/chat'}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A24C] to-[#B38B36] text-white text-sm font-semibold hover:from-[#E8C372] hover:to-[#D4A24C] transition-all flex items-center gap-2"
                data-testid="store-chat-btn"
              >
                <MessageCircle className="w-4 h-4" />
                chat
              </Link>

              <button
                type="button"
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url)
                    .then(() => toast.success('Link da loja copiado!'))
                    .catch(() => toast.error('Erro ao copiar'));
                }}
                className="px-4 py-2 rounded-lg bg-[#1E2230] hover:bg-[#2A2C36] text-white text-sm border border-[#2A2C36] hover:border-[#D4A24C]/40 transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar link
              </button>

              <button
                type="button"
                onClick={async () => {
                  const url = window.location.href;

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: store.name || 'Loja BRANE',
                        text: store.description || '',
                        url: url
                      });
                    } catch {}
                  } else {
                    navigator.clipboard.writeText(url)
                      .then(() => toast.success('Link copiado!'))
                      .catch(() => {});
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#1E2230] hover:bg-[#2A2C36] text-white text-sm border border-[#2A2C36] hover:border-[#D4A24C]/40 transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
                  {user && user.user_id === store.owner_id && (
  <Link
    to={`/add-product?store_id=${store.store_id}&from=store`}
    className="px-4 py-2 rounded-lg bg-[#D4A24C] text-white text-sm font-semibold hover:bg-[#E8C372] transition-all flex items-center gap-2"
  >
    <Package className="w-4 h-4" />
    Adicionar Produto
  </Link>
)}
            </div>
          </div>
        </div>

        <div className="mt-12 pb-12">
          <h2 className="text-xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#8B6914] via-[#D4A24C] to-[#4A7C9B] bg-clip-text text-transparent">
              Produtos da Loja
            </span>
          </h2>

          {storeProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-[#0B0D12]/50 border border-[#1E2230]">
              <Package className="w-12 h-12 text-[#6F7280] mx-auto mb-3" />
              <p className="text-[#A6A8B3]">Esta loja ainda não tem produtos de venda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {storeProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
