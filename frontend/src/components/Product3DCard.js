import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Store as StoreIcon,
  ShoppingCart,
  X,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { splitPrice } from '../lib/price';
import ProductImageZoom from './ProductImageZoom';
import '../styles/product3d.css';

const API = (process.env.REACT_APP_BACKEND_URL || 'https://brane-production-3c87.up.railway.app').trim().replace(/\/$/, '') + '/api';

/**
 * Normaliza uma URL de imagem.
 * - URLs http/https → retorna como está
 * - data:image (base64 legado) → retorna como está
 * - blob: → retorna como está
 * - qualquer outro valor → monta URL via /api/files/<valor>
 */
function normalizeImage(img) {
  if (!img) return null;
  if (
    img.startsWith('http') ||
    img.startsWith('data:image') ||
    img.startsWith('blob:')
  ) {
    return img;
  }
  return API + '/files/' + img;
}

/**
 * Skeleton de card para exibir durante carregamento do feed.
 * Mantém o mesmo tamanho do card real para evitar layout shift.
 */
export function Product3DCardSkeleton() {
  return (
    <div className="product-3d-card-wrapper brane-light-product" aria-hidden="true">
      <div className="product-3d-card" style={{ pointerEvents: 'none' }}>
        <div className="product-3d-image-container" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #1a1d27 25%, #22263a 50%, #1a1d27 75%)',
              backgroundSize: '200% 100%',
              animation: 'brane-skeleton-shimmer 1.4s infinite linear',
              borderRadius: '12px',
              minHeight: '200px',
            }}
          />
        </div>
        <div className="product-3d-info" style={{ padding: '12px' }}>
          {/* Título skeleton */}
          <div style={{
            height: '16px', borderRadius: '6px', marginBottom: '8px', width: '80%',
            background: 'linear-gradient(90deg, #1a1d27 25%, #22263a 50%, #1a1d27 75%)',
            backgroundSize: '200% 100%',
            animation: 'brane-skeleton-shimmer 1.4s infinite linear',
          }} />
          {/* Preço skeleton */}
          <div style={{
            height: '22px', borderRadius: '6px', marginBottom: '6px', width: '55%',
            background: 'linear-gradient(90deg, #1a1d27 25%, #22263a 50%, #1a1d27 75%)',
            backgroundSize: '200% 100%',
            animation: 'brane-skeleton-shimmer 1.4s 0.1s infinite linear',
          }} />
          {/* Parcelas skeleton */}
          <div style={{
            height: '12px', borderRadius: '6px', marginBottom: '8px', width: '65%',
            background: 'linear-gradient(90deg, #1a1d27 25%, #22263a 50%, #1a1d27 75%)',
            backgroundSize: '200% 100%',
            animation: 'brane-skeleton-shimmer 1.4s 0.2s infinite linear',
          }} />
        </div>
      </div>
    </div>
  );
}

export default function Product3DCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const imageRef = useRef(null);

  const [openPreview, setOpenPreview] = useState(false);
  const [previewMounted, setPreviewMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [motionRect, setMotionRect] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (previewMounted) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [previewMounted]);

  /**
   * thumbnailUrl → imagem leve para o feed (400x400 WebP)
   * imageUrl → imagem completa para o modal/detalhe (1200x1200 WebP)
   * Fallback para campos legados (image, images[])
   */
  const thumbnailSrc = useMemo(() => {
    // Preferir thumbnailUrl (novo pipeline)
    if (product.thumbnailUrl) return normalizeImage(product.thumbnailUrl);
    // Fallback legado
    const raw = product.image || (product.images && product.images[0]) || (product.photos && product.photos[0]) || null;
    return normalizeImage(raw);
  }, [product.thumbnailUrl, product.image, product.images, product.photos]);

  // Lista completa de imagens para o modal (usa imageUrl para a principal)
  const images = useMemo(() => {
    const rawImages = [];
    // Preferir imageUrl como primeira imagem no modal
    if (product.imageUrl) rawImages.push(product.imageUrl);
    if (product.image && product.image !== product.imageUrl) rawImages.push(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img !== product.imageUrl && img !== product.image) rawImages.push(img);
      });
    }
    if (product.photos && product.photos.length > 0) {
      product.photos.forEach(img => {
        if (!rawImages.includes(img)) rawImages.push(img);
      });
    }
    // Se não tem nada, usar thumbnailSrc como fallback
    if (rawImages.length === 0 && thumbnailSrc) rawImages.push(thumbnailSrc);

    return rawImages
      .map(normalizeImage)
      .filter(Boolean)
      .filter((img, i, arr) => arr.indexOf(img) === i);
  }, [product.imageUrl, product.image, product.images, product.photos, thumbnailSrc]);

  const currentImg = images[selectedImage] || images[0] || null;

  const price = splitPrice(product.price || 0);
  const whole = price.whole;
  const cents = price.cents;

  const openMotion = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setMotionRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
    } else {
      setMotionRect(null);
    }
    setSelectedImage(0);
    setShowDetails(false);
    setPreviewMounted(true);
    requestAnimationFrame(() => {
      setOpenPreview(true);
    });
    setTimeout(() => {
      setShowDetails(true);
    }, 450);
  };

  const closeMotion = () => {
    setOpenPreview(false);
    setShowDetails(false);
    setTimeout(() => {
      setPreviewMounted(false);
    }, 300);
  };

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleQuickCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1600);
  };

  const goToProduct = () => {
    navigate('/products/' + product.product_id);
  };

  const flightStyle = motionRect
    ? {
        '--start-left': motionRect.left + 'px',
        '--start-top': motionRect.top + 'px',
        '--start-width': motionRect.width + 'px',
        '--start-height': motionRect.height + 'px'
      }
    : {};

  const modalContent = previewMounted ? (
    <div className={'brane-motion-overlay ' + (openPreview ? 'is-open' : 'is-closing')}>
      <div className="brane-motion-backdrop" onClick={closeMotion}></div>

      {currentImg && !showDetails && (
        <>
          <div className="brane-flight-portal" style={flightStyle}></div>
          <img
            src={currentImg}
            alt={product.title}
            className="brane-flight-product"
            style={flightStyle}
            decoding="async"
          />
        </>
      )}

      <button
        type="button"
        onClick={closeMotion}
        aria-label="Fechar"
        style={{
          position: 'fixed',
          top: '90px',
          right: '24px',
          width: '110px',
          height: '44px',
          borderRadius: '999px',
          border: '1px solid rgba(212,162,76,0.55)',
          background: '#D4A24C',
          color: '#050608',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontWeight: 800,
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
      >
        <X size={20} />
        Fechar
      </button>

      <div className={'brane-motion-modal ' + (showDetails ? 'is-ready' : 'is-preparing')}>
        <div className="brane-motion-title-ring">
          <h2>{product.title}</h2>
        </div>

        {product.description && (
          <div className="brane-motion-description-box">
            {product.description}
          </div>
        )}

        <div className="brane-motion-side-info">
          <span className="brane-motion-badge">
            Destaque BRANE
          </span>

          <div className="brane-motion-price">
            <span>R$</span>
            <strong>{whole}</strong>
            <small>,{cents}</small>
          </div>

          <p className="brane-motion-installments">
            em até 12x
          </p>

          {product.city && (
            <div className="brane-motion-location">
              <MapPin size={14} />
              <span>{product.city}</span>
            </div>
          )}

          <div className="brane-motion-side-actions">
            <button className="brane-motion-buy" onClick={goToProduct}>
              <ShoppingCart size={18} />
              Comprar agora
            </button>

            <button className="brane-motion-cart" onClick={handleQuickCart}>
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>

        <div className="brane-motion-stage">
          {images.length > 1 && (
            <button className="brane-motion-arrow brane-motion-left" onClick={prevImage}>
              <ChevronLeft size={30} />
            </button>
          )}

          <div className="brane-motion-ring-back"></div>

          {currentImg ? (
            <img
              src={currentImg}
              alt={product.title}
              className="brane-motion-product"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="brane-motion-placeholder">
              <StoreIcon size={70} />
            </div>
          )}

          <div className="brane-motion-ring-front"></div>

          {images.length > 1 && (
            <button className="brane-motion-arrow brane-motion-right" onClick={nextImage}>
              <ChevronRight size={30} />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="brane-motion-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={'brane-motion-thumb ' + (selectedImage === i ? 'active' : '')}
              >
                <img
                  src={img}
                  alt={'Imagem ' + (i + 1)}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}

        {added && (
          <div className="brane-motion-success">
            Produto adicionado ao carrinho
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className="product-3d-card-wrapper brane-light-product"
        data-testid={'product-card-' + product.product_id}
        style={{ animationDelay: index * 0.03 + 's' }}
        onClick={openMotion}
      >
        <div className="product-3d-card">
          <div className="product-3d-image-container">
            <div className="brane-product-pedestal"></div>

            {thumbnailSrc ? (
              <>
                {/* Skeleton enquanto a thumbnail carrega */}
                {!imgLoaded && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, #1a1d27 25%, #22263a 50%, #1a1d27 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'brane-skeleton-shimmer 1.4s infinite linear',
                      borderRadius: '12px',
                      zIndex: 1,
                    }}
                  />
                )}
                <ProductImageZoom
                  imageRef={imageRef}
                  src={thumbnailSrc}
                  alt={product.title}
                  className="product-3d-image"
                  wrapperClassName="w-full h-full"
                  loading="lazy"
                  onLoad={() => setImgLoaded(true)}
                  imgStyle={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                />
              </>
            ) : (
              <div className="product-3d-placeholder">
                <StoreIcon className="w-14 h-14 text-black/20" />
              </div>
            )}

            <button
              className="product-3d-favorite"
              onClick={handleFavorite}
              aria-label="Favoritar"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <div className="product-3d-info">
            <h3 className="product-3d-title">
              {product.title}
            </h3>

            <div className="product-3d-price-container">
              <span className="product-3d-currency">R$</span>
              <span className="product-3d-price-whole">{whole}</span>
              <span className="product-3d-price-cents">,{cents}</span>
            </div>

            <p className="product-3d-installments">
              em até 12x sem juros
            </p>

            <div className="product-3d-meta">
              <span>
                <Star size={12} fill="currentColor" />
                4.9
              </span>

              {product.city && (
                <span>
                  <MapPin size={12} />
                  {product.city}
                </span>
              )}
            </div>

            <button
              className="product-cart-floating"
              onClick={handleQuickCart}
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
