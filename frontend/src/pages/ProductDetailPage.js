import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Share2, MapPin, Copy, Check, Store, Zap, ArrowRight, ExternalLink, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    axios.get(`${API}/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => toast.error('Produto nao encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async (goToCheckout = false) => {
    if (!user) { navigate('/auth'); return; }
    if (goToCheckout) setBuyingNow(true);
    else setAddingToCart(true);
    try {
      await axios.post(`${API}/cart`, { product_id: id, quantity }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      if (goToCheckout) navigate('/checkout');
      else toast.success('Adicionado ao carrinho!');
    } catch { toast.error('Erro ao adicionar'); }
    finally { setAddingToCart(false); setBuyingNow(false); }
  };

  const generateAffiliateLink = async () => {
    if (!user) { navigate('/auth'); return; }
    try {
      const res = await axios.post(`${API}/affiliates/link`, { product_id: id }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      setAffiliateCode(res.data.code);
      toast.success('Link de afiliado criado!');
    } catch { toast.error('Erro ao criar link'); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/products/${id}?ref=${affiliateCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#EAEDED]"><div className="w-8 h-8 border-4 border-[#F0C14B] border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-[#EAEDED]"><p className="text-[#565959]">Produto nao encontrado</p></div>;

  const images = product.images || [];
  const currentImg = images[selectedImage];
  const imgUrl = currentImg ? (currentImg.startsWith('http') ? currentImg : `${API}/files/${currentImg}`) : null;

  const priceWhole = Math.floor(product.price || 0);
  const priceCents = Math.round(((product.price || 0) - priceWhole) * 100).toString().padStart(2, '0');
  const rating = product.rating || 4.2;
  const ratingCount = product.rating_count || Math.floor(Math.random() * 500 + 50);
  const stars = Math.round(rating * 2) / 2;

  const conditionLabels = { new: 'Novo', like_new: 'Seminovo', good: 'Bom Estado', fair: 'Usado' };

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6" data-testid="product-detail-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-[400px_1fr_280px] gap-6">
            
            {/* Left: Images */}
            <div>
              <div className="bg-white rounded-lg overflow-hidden flex items-center justify-center aspect-square border border-[#E0E0E0] mb-3">
                {imgUrl ? (
                  <img src={imgUrl} alt={product.title} className="max-w-full max-h-full object-contain p-4" data-testid="product-image" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50"><Store className="w-16 h-16 text-gray-300" /></div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => {
                    const thumbUrl = img.startsWith('http') ? img : `${API}/files/${img}`;
                    return (
                      <button key={i} onClick={() => setSelectedImage(i)}
                        className={`w-14 h-14 rounded border-2 overflow-hidden shrink-0 ${selectedImage === i ? 'border-[#E77600]' : 'border-[#E0E0E0] hover:border-[#E77600]'}`}>
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center: Product Info */}
            <div>
              <h1 className="text-xl md:text-2xl font-normal text-[#0F1111] leading-tight mb-2" data-testid="product-title">{product.title}</h1>

              {/* Seller link */}
              {product.seller && (
                <p className="text-sm mb-2">
                  <span className="text-[#565959]">Vendido por </span>
                  <Link to={product.seller.store_slug ? `/stores/${product.seller.store_slug}` : '#'} className="text-[#007185] hover:text-[#C7511F] hover:underline">
                    {product.seller.name}
                  </Link>
                </p>
              )}

              {/* Stars */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-[#007185]">{rating.toFixed(1)}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= stars ? 'fill-[#FFA41C] text-[#FFA41C]' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-[#007185] hover:text-[#C7511F] cursor-pointer">{ratingCount} avaliacoes</span>
              </div>

              <hr className="border-[#E0E0E0] mb-3" />

              {/* Price */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-[#565959]">R$</span>
                  <span className="text-[32px] font-bold text-[#0F1111] leading-none">{priceWhole}</span>
                  <span className="text-sm font-bold text-[#0F1111] align-super">,{priceCents}</span>
                </div>
                <p className="text-sm text-[#565959] mt-1">
                  em ate <span className="font-bold text-[#0F1111]">12x</span> de <span className="font-bold text-[#0F1111]">R$ {(product.price / 12).toFixed(2)}</span>
                </p>
              </div>

              {/* Badges */}
              {(product.product_type === 'secondhand' || product.product_type === 'unique') && (
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded font-bold text-white ${product.product_type === 'secondhand' ? 'bg-orange-500' : 'bg-purple-600'}`}>
                    {product.product_type === 'secondhand' ? 'SEGUNDA MAO' : 'PRODUTO UNICO'}
                  </span>
                  {product.condition && (
                    <span className="text-xs px-2 py-1 rounded bg-[#F0F2F2] text-[#565959] border border-[#D5D9D9]">
                      {conditionLabels[product.condition] || product.condition}
                    </span>
                  )}
                </div>
              )}

              {/* Delivery info */}
              <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-[#F7FAFA] border border-[#D5E4D5]">
                <Truck className="w-5 h-5 text-[#067D62]" />
                <div>
                  <p className="text-sm"><span className="text-[#067D62] font-bold">Frete GRATIS</span> <span className="text-[#565959]">no primeiro pedido</span></p>
                  <p className="text-xs text-[#565959]">Entrega estimada: 5-10 dias uteis</p>
                </div>
              </div>

              {product.city && (
                <div className="flex items-center gap-1 text-sm text-[#565959] mb-3">
                  <MapPin className="w-4 h-4" /> {product.city} {product.location && `- ${product.location}`}
                </div>
              )}

              {/* Description */}
              <hr className="border-[#E0E0E0] mb-3" />
              <div>
                <h3 className="text-lg font-bold text-[#0F1111] mb-2">Sobre este produto</h3>
                <p className="text-sm text-[#333] leading-relaxed whitespace-pre-line" data-testid="product-description">{product.description}</p>
              </div>

              {/* Trust badges */}
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1 text-xs text-[#565959]"><Shield className="w-4 h-4 text-[#067D62]" /> Compra segura</div>
                <div className="flex items-center gap-1 text-xs text-[#565959]"><RotateCcw className="w-4 h-4 text-[#067D62]" /> Devolucao gratis</div>
              </div>
            </div>

            {/* Right: Buy Box */}
            <div className="border border-[#D5D9D9] rounded-lg p-4 h-fit">
              {/* Price in buy box */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-[#565959]">R$</span>
                  <span className="text-[28px] font-bold text-[#0F1111] leading-none">{priceWhole}</span>
                  <span className="text-sm font-bold text-[#0F1111] align-super">,{priceCents}</span>
                </div>
              </div>

              <p className="text-sm text-[#067D62] font-bold mb-1">Em estoque</p>
              <p className="text-xs text-[#565959] mb-3">Vendido por <span className="text-[#007185]">{product.seller?.name || 'BRANE'}</span></p>

              {/* Quantity */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-[#0F1111]">Qtd:</span>
                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#D5D9D9] bg-[#F0F2F2] text-sm text-[#0F1111] focus:outline-none focus:border-[#E77600]">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Buy buttons - Amazon style */}
              <div className="space-y-2">
                <button onClick={() => addToCart(false)} disabled={addingToCart}
                  className="w-full py-2 rounded-full bg-gradient-to-b from-[#F7DFA5] to-[#F0C14B] hover:from-[#F0C14B] hover:to-[#E7A82E] text-sm font-medium text-[#0F1111] border border-[#A88734] shadow-sm disabled:opacity-50"
                  data-testid="add-to-cart-btn">
                  {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </button>
                <button onClick={() => addToCart(true)} disabled={buyingNow}
                  className="w-full py-2 rounded-full bg-gradient-to-b from-[#FFB347] to-[#FF8C00] hover:from-[#FFA726] hover:to-[#E65100] text-sm font-medium text-[#0F1111] border border-[#CA6F1E] shadow-sm disabled:opacity-50"
                  data-testid="buy-now-btn">
                  <span className="flex items-center justify-center gap-1"><Zap className="w-4 h-4" /> {buyingNow ? 'Processando...' : 'Comprar Agora'}</span>
                </button>
              </div>

              {/* Security info */}
              <div className="mt-4 pt-3 border-t border-[#E0E0E0] space-y-1">
                <div className="flex justify-between text-xs"><span className="text-[#565959]">Pagamento</span><span className="text-[#007185]">Seguro</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#565959]">Entrega</span><span className="text-[#007185]">BRANE</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#565959]">Devolucao</span><span className="text-[#007185]">Gratis 30 dias</span></div>
              </div>

              {/* Affiliate link */}
              {user?.role === 'affiliate' && (
                <div className="mt-4 pt-3 border-t border-[#E0E0E0]">
                  {!affiliateCode ? (
                    <button onClick={generateAffiliateLink}
                      className="w-full py-2 rounded-full text-sm border border-[#D5D9D9] bg-white text-[#0F1111] hover:bg-[#F7F7F7]"
                      data-testid="generate-affiliate-link">
                      <span className="flex items-center justify-center gap-1"><Share2 className="w-4 h-4" /> Gerar Link de Afiliado</span>
                    </button>
                  ) : (
                    <div>
                      <p className="text-xs text-[#565959] mb-1">Seu link de afiliado:</p>
                      <div className="flex gap-1">
                        <code className="flex-1 text-[10px] bg-[#F0F2F2] p-2 rounded border border-[#D5D9D9] text-[#0F1111] truncate">
                          {`${window.location.origin}/products/${id}?ref=${affiliateCode}`}
                        </code>
                        <button onClick={copyLink} className="p-2 rounded border border-[#D5D9D9] bg-[#F0F2F2] hover:bg-[#E0E0E0]" data-testid="copy-affiliate-link">
                          {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-[#565959]" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
