import { X, ChevronLeft, ChevronRight, ShoppingCart, MapPin } from 'lucide-react';
import '../styles/product3d.css';

export default function Product3DPreview({
  product,
  images = [],
  currentImg,
  selectedImage,
  setSelectedImage,
  closeMotion,
  handleQuickCart,
  goToProduct,
  added,
  whole,
  cents,
  flightStyle,
  showDetails
}) {
  const nextImage = () => {
    if (!images.length) return;
    setSelectedImage((prev) => prev === images.length - 1 ? 0 : prev + 1);
  };

  const prevImage = () => {
    if (!images.length) return;
    setSelectedImage((prev) => prev === 0 ? images.length - 1 : prev - 1);
  };

  return (
    <div className="brane-motion-overlay">
      <div className="brane-motion-backdrop" onClick={closeMotion} />

      {currentImg && !showDetails && (
        <>
          <div className="brane-flight-portal"></div>

          <img
            src={currentImg}
            alt={product.title}
            className="brane-flight-product"
            style={flightStyle}
          />
        </>
      )}

      <button
        type="button"
        onClick={closeMotion}
        aria-label="Fechar"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          width: 54,
          height: 54,
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(5,6,10,0.96)',
          color: '#ffffff',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
      >
        <X size={26} />
      </button>

      <div className="brane-motion-modal is-ready">
        <div className="brane-motion-title-ring">
          <h2>{product.title}</h2>
        </div>

        <div className="brane-motion-side-info">
          <div className="brane-motion-badge">
            Destaque BRANE
          </div>

          <div className="brane-motion-price">
            <span>R$</span>
            <strong>{whole}</strong>
            <small>,{cents}</small>
          </div>

          <div className="brane-motion-installments">
            em até 12x
          </div>

          {product.city && (
            <div className="brane-motion-location">
              <MapPin className="w-3 h-3" />
              <span>{product.city}</span>
            </div>
          )}

          <div className="brane-motion-side-actions">
            <button className="brane-motion-buy" onClick={goToProduct}>
              Comprar agora
            </button>

            <button className="brane-motion-cart" onClick={handleQuickCart}>
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {added && (
            <div className="brane-motion-success">
              Adicionado
            </div>
          )}
        </div>

        <div className="brane-motion-stage">
          {images.length > 1 && (
            <button className="brane-motion-arrow brane-motion-left" onClick={prevImage}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="brane-motion-ring-back" />
          <div className="brane-motion-ring-front" />

          {currentImg ? (
            <img
              src={currentImg}
              alt={product.title}
              className="brane-motion-product"
            />
          ) : (
            <div className="brane-motion-placeholder">
              Sem imagem
            </div>
          )}

          {images.length > 1 && (
            <button className="brane-motion-arrow brane-motion-right" onClick={nextImage}>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="brane-motion-thumbs">
            {images.map((img, index) => (
              <button
                key={index}
                className={'brane-motion-thumb ' + (selectedImage === index ? 'active' : '')}
                onClick={() => setSelectedImage(index)}
              >
                <img src={img} alt={'thumb-' + index} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
