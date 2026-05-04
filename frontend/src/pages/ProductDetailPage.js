import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingCart, Share2, MapPin, Copy, Check, Store, Zap, Star, Truck, Shield,
  RotateCcw, ChevronLeft, ChevronRight, Home as HomeIcon, Heart, Users
} from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '../components/AuthModal';
import ProductImageZoom from '../components/ProductImageZoom';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setLoading(true);

    axios.get(API + '/products/' + id)
      .then((res) => {
        setProduct(res.data);
        const cat = res.data.category;
        return axios.get(API + '/products?category=' + (cat || '') + '&limit=12');
      })
      .then((r) => {
        if (r) {
          setRelated((r.data.products || []).filter((p) => p.product_id !== id).slice(0, 6));
        }
      })
      .catch(() => toast.error('Produto não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const requireLogin = () => {
    setShowAuthModal(true);
  };

  const addToCart = async (goToCheckout) => {
    if (!user) {
      requireLogin();
      return;
    }

    if (goToCheckout) setBuyingNow(true);
    else setAddingToCart(true);

    try {
      await axios.post(
        API + '/cart',
        { product_id: id, quantity: quantity },
        { headers: { Authorization: 'Bearer ' + token } }
      );

      if (goToCheckout) navigate('/checkout');
      else toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar');
    } finally {
      setAddingToCart(false);
      setBuyingNow(false);
    }
  };

  const generateAffiliateLink = async () => {
    if (!user) {
      requireLogin();
      return;
    }

    try {
      const res = await axios.post(
        API + '/affiliates/link',
        { product_id: id },
        { headers: { Authorization: 'Bearer ' + token } }
      );

      setAffiliateCode(res.data.code);
      toast.success('Link de afiliado criado!');
    } catch {
      toast.error('Erro ao criar link');
    }
  };

  const copyAffiliateLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/products/' + id + '?ref=' + affiliateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4F8]">
        <div className="w-10 h-10 border-4 border-[#5B1CB5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4F8]">
        <p className="text-gray-600">Produto não encontrado</p>
      </div>
    );
  }

  const images = product.images && product.images.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const currentImg = images[selectedImage];

  const imgUrl = currentImg
    ? (
        currentImg.startsWith('data:image') || currentImg.startsWith('http')
          ? currentImg
          : API + '/files/' + currentImg
      )
    : null;

  const priceWhole = Math.floor(product.price || 0);
  const priceCents = Math.round(((product.price || 0) - priceWhole) * 100).toString().padStart(2, '0');
  const rating = product.rating || 4.6;
  const ratingCount = product.rating_count || 56;
  const stars = Math.round(rating * 2) / 2;

  const conditionLabels = {
    new: 'Novo',
    like_new: 'Seminovo',
    good: 'Bom Estado',
    fair: 'Usado'
  };

  const categoryLabels = {
    eletronicos: 'Eletrônicos',
    roupas: 'Moda',
    casa: 'Casa & Decoração',
    esportes: 'Esportes',
    colecionaveis: 'Colecionáveis',
    automoveis: 'Veículos'
  };

  const categoryLabel = categoryLabels[product.category] || 'Produtos';

  const isDesapega =
    product.product_type === 'secondhand' ||
    product.listing_type === 'desapega' ||
    product.source === 'desapega';

  const prevImage = () => {
    setSelectedImage((i) => (i - 1 + images.length) % Math.max(images.length, 1));
  };

  const nextImage = () => {
    setSelectedImage((i) => (i + 1) % Math.max(images.length, 1));
  };

  return (
    <div className="min-h-screen bg-[#F6F4F8] pb-12" data-testid="product-detail-page">
      <div className="max-w-[1300px] mx-auto px-4 pt-6 pb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/market" className="flex items-center gap-1 hover:text-[#5B1CB5] transition">
            <HomeIcon className="w-4 h-4" /> Home
          </Link>

          <span>/</span>

          <Link to="/market" className="hover:text-[#5B1CB5] transition">
            Produtos
          </Link>

          <span>/</span>

          <Link to="/market" className="hover:text-[#5B1CB5] transition">
            {categoryLabel}
          </Link>

          <span>/</span>

          <span className="text-gray-800 font-medium truncate max-w-[220px]">
            {product.title}
          </span>
        </nav>
      </div>

      <div className="max-w-[1300px] mx-auto px-4">
        <div className="bg-white rounded-[24px] shadow-[0_18px_50px_-24px_rgba(80,40,140,0.16)] border border-[#E6E1EC] p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)_minmax(0,340px)] gap-8">
            <div>
              <div className="relative group rounded-2xl overflow-hidden aspect-square bg-[#F6F4F8] border border-[#EEE8F2]">
                {imgUrl ? (
                  <ProductImageZoom
                    mode="detailPro"
                    src={imgUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white flex items-center justify-center transition" aria-label="Anterior">
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white flex items-center justify-center transition" aria-label="Próxima">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {images.map((img, i) => {
                    const thumbUrl =
                      img.startsWith('data:image') || img.startsWith('http')
                        ? img
                        : API + '/files/' + img;

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={'w-16 h-16 rounded-xl overflow-hidden ring-2 transition ' + (selectedImage === i ? 'ring-[#5B1CB5]' : 'ring-[#EEE8F2] hover:ring-[#5B1CB5]/60')}
                      >
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight mb-2 tracking-tight" data-testid="product-title">
                {product.title}
              </h1>

              {product.seller && (
                <p className="text-sm mb-3">
                  <span className="text-gray-500">Vendido por </span>
                  <Link to={product.seller.store_slug ? '/stores/' + product.seller.store_slug : '#'} className="text-[#5B1CB5] hover:underline font-semibold">
                    {product.seller.name}
                  </Link>
                </p>
              )}

              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={'w-4 h-4 ' + (i <= stars ? 'fill-[#F5A623] text-[#F5A623]' : 'fill-gray-200 text-gray-200')} />
                  ))}
                </div>

                <span className="text-xs text-gray-300">|</span>

                <button className="text-sm text-[#5B1CB5] hover:underline">
                  {ratingCount} avaliações
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[#5B1CB5]">R$</span>
                  <span className="text-5xl font-black text-[#111111] leading-none tracking-tight">{priceWhole}</span>
                  <span className="text-lg font-bold text-[#111111]">,{priceCents}</span>
                </div>

                <p className="text-sm text-gray-500 mt-1.5">
                  em até <span className="font-semibold text-gray-800">12x</span> de <span className="font-semibold text-gray-800">R$ {(product.price / 12).toFixed(2).replace('.', ',')}</span>
                </p>
              </div>

              {(product.product_type === 'secondhand' || product.product_type === 'unique' || product.condition) && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {product.product_type === 'secondhand' && (
                    <span className="brane-chip-segundamao">Segunda Mão</span>
                  )}

                  {product.product_type === 'unique' && (
                    <span className="brane-chip-seminovo">Produto Único</span>
                  )}

                  {product.condition && (
                    <span className="brane-chip-seminovo">
                      {conditionLabels[product.condition] || product.condition}
                    </span>
                  )}
                </div>
              )}

              <div className="border-t border-[#EEE8F2] my-4" />

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E8F7F0] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#10A875]" />
                </div>

                <div>
                  <p className="text-sm">
                    <span className="text-[#10A875] font-bold">Frete GRÁTIS</span>
                    <span className="text-gray-700"> no primeiro pedido</span>
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Entrega estimada: <span className="text-[#5B1CB5] font-semibold">5 a 10 dias úteis</span>
                  </p>
                </div>
              </div>

              {product.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-5">
                  <MapPin className="w-4 h-4 text-[#5B1CB5]" />
                  {product.city}
                  {product.location && ', ' + product.location}
                </div>
              )}

              <div className="border-t border-[#EEE8F2] pt-5">
                <h3 className="text-base font-bold text-[#111111] mb-2">
                  Sobre este produto
                </h3>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-5" data-testid="product-description">
                  {product.description || 'Sem descrição disponível.'}
                </p>

                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-[#5B1CB5] font-medium">
                    <Shield className="w-4 h-4" /> Compra segura
                  </span>

                  <span className="flex items-center gap-1.5 text-sm text-[#5B1CB5] font-medium">
                    <RotateCcw className="w-4 h-4" /> Devolução grátis
                  </span>
                </div>
              </div>
            </div>

            <div className="h-fit">
              <div className="border border-[#E6E1EC] rounded-[20px] p-6 bg-white">
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#5B1CB5]">R$</span>
                    <span className="text-3xl font-black text-[#111111] leading-none">{priceWhole}</span>
                    <span className="text-base font-bold text-[#111111]">,{priceCents}</span>
                  </div>
                </div>

                <p className="text-sm font-bold text-[#10A875] mb-1">
                  Em estoque
                </p>

                <p className="text-xs text-gray-500 mb-5">
                  Vendido por <span className="text-[#5B1CB5] font-semibold">{product.seller && product.seller.name ? product.seller.name : 'BRANE'}</span>
                </p>

                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-gray-700 font-medium">Qtd:</span>

                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-[#E6E1EC] bg-white text-sm text-gray-900 focus:outline-none focus:border-[#5B1CB5] focus:ring-2 focus:ring-[#5B1CB5]/20"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {isDesapega ? (
                    <>
                      <div className="bg-[#FFF5E0] border border-[#D4A24C] rounded-xl p-3 text-xs text-[#5A4413] mb-2">
                        <strong className="block mb-1">Produto do Desapega</strong>
                        Para comprar, converse direto com o vendedor para combinar pagamento e entrega.
                      </div>

                      <button
                        onClick={() => {
                          if (!user) {
                            requireLogin();
                            return;
                          }

                          const sid =
                            product.seller_id ||
                            (product.seller && product.seller.seller_id) ||
                            (product.seller && product.seller.user_id);

                          if (!sid) {
                            toast.error('Vendedor indisponível');
                            return;
                          }

                          if (sid === user.user_id) {
                            toast.error('Você é o vendedor deste produto');
                            return;
                          }

                          navigate('/chat/' + sid + '?product=' + id);
                        }}
                        className="w-full py-3 rounded-full text-sm font-bold text-white transition flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #3B0F80 0%, #5B1CB5 100%)',
                          boxShadow: '0 12px 30px -10px rgba(91, 28, 181, 0.5)'
                        }}
                        data-testid="chat-seller-btn"
                      >
                        <Share2 className="w-4 h-4" />
                        Conversar com o vendedor
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => addToCart(false)}
                        disabled={addingToCart}
                        className="w-full py-3 rounded-full text-sm font-bold border transition disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{
                          background: '#FFF3C4',
                          borderColor: '#D4A24C',
                          color: '#1A1A1A'
                        }}
                        data-testid="add-to-cart-btn"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                      </button>

                      <button
                        onClick={() => addToCart(true)}
                        disabled={buyingNow}
                        className="w-full py-3 rounded-full text-sm font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #C65A1C 0%, #6D28D9 100%)',
                          boxShadow: '0 12px 30px -10px rgba(109, 40, 217, 0.5)'
                        }}
                        data-testid="buy-now-btn"
                      >
                        <Zap className="w-4 h-4" />
                        {buyingNow ? 'Processando...' : 'Comprar Agora'}
                      </button>

                      <button
                        onClick={() => {
                          if (!user) {
                            requireLogin();
                            return;
                          }

                          if (product.store_slug || product.store_id) {
                            navigate('/stores/' + (product.store_slug || product.store_id) + '/chat');
                          } else {
                            const sid =
                              product.seller_id ||
                              (product.seller && product.seller.seller_id) ||
                              (product.seller && product.seller.user_id);

                            if (!sid) {
                              toast.error('Vendedor indisponível');
                              return;
                            }

                            if (sid === user.user_id) {
                              toast.error('Você é o vendedor deste produto');
                              return;
                            }

                            navigate('/chat/' + sid + '?product=' + id);
                          }
                        }}
                        className="w-full py-2.5 rounded-full text-sm font-medium border border-[#5B1CB5]/40 bg-[#F5EBFF] hover:bg-[#EEDDFF] text-[#5B1CB5] flex items-center justify-center gap-2 transition"
                        data-testid="chat-store-btn"
                      >
                        <Share2 className="w-4 h-4" /> Conversar com o vendedor
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-[#E6E1EC] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Pagamento</span>
                    <span className="text-gray-800 font-semibold">Seguro</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Entrega</span>
                    <span className="text-gray-800 font-semibold">BRANE</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Devolução</span>
                    <span className="text-[#5B1CB5] font-semibold">Grátis 30 dias</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    requireLogin();
                    return;
                  }

                  setFavorited((f) => !f);
                  toast.success(favorited ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
                }}
                className="w-full mt-3 py-2.5 rounded-full text-sm font-medium border border-[#E6E1EC] bg-white hover:bg-[#F6F4F8] text-gray-700 flex items-center justify-center gap-2 transition"
                data-testid="favorite-btn"
              >
                <Heart className={'w-4 h-4 ' + (favorited ? 'fill-[#FF5A5F] text-[#FF5A5F]' : 'text-gray-500')} />
                {favorited ? 'Favoritado' : 'Favoritar'}
              </button>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url)
                      .then(() => toast.success('Link copiado!'))
                      .catch(() => toast.error('Erro ao copiar'));
                  }}
                  className="w-full py-2.5 rounded-full text-sm font-medium border border-[#E6E1EC] bg-white hover:bg-[#F6F4F8] text-gray-700 flex items-center justify-center gap-2 transition"
                  data-testid="copy-product-link-btn"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                  Copiar link do produto
                </button>

                <button
                  onClick={async () => {
                    const url = window.location.href;

                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: product.title || 'Produto BRANE',
                          text: product.description || '',
                          url: url
                        });
                      } catch {
                      }
                    } else {
                      navigator.clipboard.writeText(url)
                        .then(() => toast.success('Link copiado!'))
                        .catch(() => {});
                    }
                  }}
                  className="w-full py-2.5 rounded-full text-sm font-medium border border-[#E6E1EC] bg-white hover:bg-[#F6F4F8] text-gray-700 flex items-center justify-center gap-2 transition"
                  data-testid="share-btn"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                  Compartilhar produto
                </button>
              </div>

              {user && user.role === 'affiliate' && (
                <div className="mt-3 p-3 rounded-2xl bg-[#EEE1FF] border border-[#D4B8FF]">
                  {!affiliateCode ? (
                    <button
                      onClick={generateAffiliateLink}
                      className="w-full py-2 rounded-full text-sm font-semibold bg-white border border-[#5B1CB5]/40 text-[#5B1CB5] hover:bg-[#F5EBFF] transition"
                      data-testid="generate-affiliate-link"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Gerar Link de Afiliado
                      </span>
                    </button>
                  ) : (
                    <div>
                      <p className="text-xs text-[#7A2CE0] mb-1 font-semibold">
                        Seu link de afiliado:
                      </p>

                      <div className="flex gap-1">
                        <code className="flex-1 text-[10px] bg-white p-2 rounded border border-[#D4B8FF] text-gray-800 truncate">
                          {window.location.origin + '/products/' + id + '?ref=' + affiliateCode}
                        </code>

                        <button
                          onClick={copyAffiliateLink}
                          className="p-2 rounded border border-[#D4B8FF] bg-white hover:bg-[#F5EBFF]"
                          data-testid="copy-affiliate-link"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#5B1CB5]" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-6 bg-white rounded-[24px] shadow-[0_18px_50px_-24px_rgba(80,40,140,0.16)] border border-[#E6E1EC] p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EEE1FF] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#5B1CB5]" />
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-[#111111]">
                  Quem viu este produto, também se interessou
                </h2>
              </div>

              <Link to="/market" className="text-sm text-[#5B1CB5] hover:underline font-semibold flex items-center gap-1">
                Ver mais produtos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map((p) => {
                const pImg = p.images && p.images[0];
                const pUrl = pImg
                  ? (pImg.startsWith('http') ? pImg : API + '/files/' + pImg)
                  : null;

                return (
                  <Link
                    key={p.product_id}
                    to={'/products/' + p.product_id}
                    className="group block rounded-2xl overflow-hidden border border-[#E6E1EC] bg-white hover:shadow-lg hover:border-[#5B1CB5]/40 transition-all"
                  >
                    <div className="aspect-square bg-[#F6F4F8] relative overflow-hidden">
                      {pUrl ? (
                        <img
                          src={pUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();

                          if (!user) {
                            requireLogin();
                            return;
                          }

                          toast.success('Adicionado aos favoritos');
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-[#FEE] transition"
                      >
                        <Heart className="w-4 h-4 text-gray-400 hover:text-[#FF5A5F] transition" />
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="text-xs text-gray-700 line-clamp-2 min-h-[2.2rem] mb-1">
                        {p.title}
                      </p>

                      <p className="text-sm font-bold text-[#5B1CB5]">
                        R$ {Number(p.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
