import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Share2, MapPin, User, Copy, Check, Store, Zap, ArrowRight, ExternalLink } from 'lucide-react';
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
      if (goToCheckout) {
        navigate('/checkout');
      } else {
        toast.success('Adicionado ao carrinho!');
      }
    } catch { toast.error('Erro ao adicionar ao carrinho'); }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center carbon-bg"><p className="text-[#888]">Produto nao encontrado</p></div>;

const img = product.images?.[0];

const imgUrl =
  img?.startsWith('http')
    ? img
    : img
      ? `${API}/files/${img}`
      : null;
  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="product-detail-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="dark-card rounded-xl overflow-hidden aspect-square">
            {imgUrl ? (
              <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" data-testid="product-image" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1A1A1A] text-[#444]"><Store className="w-16 h-16" /></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white mb-2" data-testid="product-title">{product.title}</h1>
            {product.city && (
              <div className="flex items-center gap-1 text-sm text-[#888] mb-4">
                <MapPin className="w-4 h-4" /> {product.city} {product.location && `- ${product.location}`}
              </div>
            )}
            <p className="text-3xl font-bold text-[#B38B36] mb-4" data-testid="product-price">R$ {product.price?.toFixed(2)}</p>
            <p className="text-[#999] mb-6 leading-relaxed" data-testid="product-description">{product.description}</p>
            
            {product.seller && (
              <Link 
                to={product.seller.store_slug ? `/stores/${product.seller.store_slug}` : '#'} 
                className="flex items-center justify-between gap-3 mb-6 p-4 dark-card rounded-lg hover:border-[#B38B36]/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B38B36]/20 to-[#B38B36]/5 flex items-center justify-center">
                    <Store className="w-5 h-5 text-[#B38B36]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white group-hover:text-[#B38B36] transition-colors">{product.seller.name}</p>
                    <p className="text-xs text-[#888]">
                      {product.seller.store_slug ? 'Ver loja do vendedor' : 'Vendedor'}
                    </p>
                  </div>
                </div>
                {product.seller.store_slug && (
                  <ExternalLink className="w-4 h-4 text-[#666] group-hover:text-[#B38B36] transition-colors" />
                )}
              </Link>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[#888] text-sm">Quantidade:</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#B38B36] transition-colors"
                >-</button>
                <span className="w-10 text-center text-white font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#B38B36] transition-colors"
                >+</button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Buy Now Button */}
              <Button 
                className="w-full bg-gradient-to-r from-[#B38B36] to-[#D4A84B] hover:from-[#9A752B] hover:to-[#B38B36] text-white rounded-lg py-6 text-base font-semibold shadow-lg shadow-[#B38B36]/20" 
                onClick={() => addToCart(true)} 
                disabled={buyingNow}
                data-testid="buy-now-btn"
              >
                <Zap className="w-5 h-5 mr-2" /> {buyingNow ? 'Processando...' : 'Comprar Agora'}
              </Button>
              
              {/* Add to Cart Button */}
              <Button 
                variant="outline"
                className="w-full rounded-lg py-6 text-base border-[#B38B36] text-[#B38B36] hover:bg-[#B38B36]/10" 
                onClick={() => addToCart(false)} 
                disabled={addingToCart} 
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
              </Button>

              {/* Continue Shopping */}
              <Button 
                variant="ghost"
                className="w-full text-[#888] hover:text-white"
                onClick={() => navigate('/products')}
              >
                Continuar Comprando <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {user?.role === 'affiliate' && (
                !affiliateCode ? (
                  <Button variant="outline" className="w-full rounded-lg border-[#2A2A2A] text-[#B38B36]" onClick={generateAffiliateLink} data-testid="generate-affiliate-link">
                    <Share2 className="w-4 h-4 mr-2" /> Gerar Link de Afiliado
                  </Button>
                ) : (
                  <div className="dark-card p-3 rounded-lg">
                    <p className="text-xs text-[#888] mb-2">Seu link de afiliado:</p>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-[#111] p-2 rounded border border-[#2A2A2A] text-[#CCC] truncate">
                        {`${window.location.origin}/products/${id}?ref=${affiliateCode}`}
                      </code>
                      <Button size="sm" variant="outline" className="border-[#2A2A2A]" onClick={copyLink} data-testid="copy-affiliate-link">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#888]" />}
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
