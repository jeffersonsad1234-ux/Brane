import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Share2, MapPin, User, Copy, Check } from 'lucide-react';
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
  const [affiliateCode, setAffiliateCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API}/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => toast.error('Produto nao encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user) { navigate('/auth'); return; }
    setAddingToCart(true);
    try {
      await axios.post(`${API}/cart`, { product_id: id }, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true
      });
      toast.success('Adicionado ao carrinho!');
    } catch (err) {
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  const generateAffiliateLink = async () => {
    if (!user) { navigate('/auth'); return; }
    try {
      const res = await axios.post(`${API}/affiliates/link`,
        { product_id: id },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setAffiliateCode(res.data.code);
      toast.success('Link de afiliado criado!');
    } catch {
      toast.error('Erro ao criar link');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/products/${id}?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <div className="w-8 h-8 border-4 border-[#B38B36] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
      <p className="text-[#999]">Produto nao encontrado</p>
    </div>
  );

  const imgUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API}/files/${product.images[0]}`)
    : null;

  return (
    <div className="min-h-screen bg-[#F9F9F8] py-8" data-testid="product-detail-page">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden aspect-square">
            {imgUrl ? (
              <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" data-testid="product-image" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#F5F5F5] text-[#CCC]">
                <span className="text-6xl">&#128722;</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-[#1A1A1A] mb-2" data-testid="product-title">
              {product.title}
            </h1>

            {product.city && (
              <div className="flex items-center gap-1 text-sm text-[#666] mb-4">
                <MapPin className="w-4 h-4" /> {product.city}
                {product.location && <span> - {product.location}</span>}
              </div>
            )}

            <p className="text-3xl font-bold text-[#B38B36] mb-4" data-testid="product-price">
              R$ {product.price?.toFixed(2)}
            </p>

            <p className="text-[#666] mb-6 leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {product.seller && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-[#F9F9F8] rounded-lg">
                <User className="w-8 h-8 text-[#B38B36]" />
                <div>
                  <p className="font-medium text-sm">{product.seller.name}</p>
                  <p className="text-xs text-[#999]">Vendedor</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button className="w-full gold-btn rounded-lg py-6 text-base" onClick={addToCart}
                disabled={addingToCart} data-testid="add-to-cart-btn">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
              </Button>

              {user?.role === 'affiliate' && (
                <div>
                  {!affiliateCode ? (
                    <Button variant="outline" className="w-full rounded-lg" onClick={generateAffiliateLink} data-testid="generate-affiliate-link">
                      <Share2 className="w-4 h-4 mr-2" /> Gerar Link de Afiliado
                    </Button>
                  ) : (
                    <div className="bg-[#F9F9F8] p-3 rounded-lg border border-[#E5E5E5]">
                      <p className="text-xs text-[#666] mb-2">Seu link de afiliado:</p>
                      <div className="flex gap-2">
                        <code className="flex-1 text-xs bg-white p-2 rounded border truncate">
                          {`${window.location.origin}/products/${id}?ref=${affiliateCode}`}
                        </code>
                        <Button size="sm" variant="outline" onClick={copyLink} data-testid="copy-affiliate-link">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
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
