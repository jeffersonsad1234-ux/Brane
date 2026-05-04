import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

/**
 * Renders active ads for a given position.
 * position: 'top' | 'between_products' | 'sidebar' | 'footer'
 */
export default function AdSlot({ position, className = '', maxItems = 1 }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    axios.get(API + '/ads', { params: { position } })
      .then((r) => {
        if (cancelled) return;
        setAds((r.data.ads || []).slice(0, maxItems));
      })
      .catch(() => {
        if (!cancelled) {
          setAds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [position, maxItems]);

  if (!ads || ads.length === 0) return null;

  const handleClick = (ad) => {
    axios.post(API + '/ads/' + ad.ad_id + '/click').catch(() => {});
  };

  const resolveImg = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : API + '/files/' + img;
  };

  const openLink = (link) => {
    if (!link) return;

    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener');
    } else {
      window.location.href = link;
    }
  };

  return (
    <div
      className={'brane-ad-slot brane-ad-' + position + ' ' + className}
      data-testid={'ad-slot-' + position}
    >
      <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2">
        {ads.map((ad) => (
          <a
            key={ad.ad_id}
            href={ad.link || '#'}
            onClick={(e) => {
              e.preventDefault();
              handleClick(ad);
              openLink(ad.link);
            }}
            className="min-w-full block rounded-3xl overflow-hidden border border-[#1E2230] hover:border-[#D4A24C]/50 transition-colors duration-300 bg-[#0B0D12]"
            data-testid={'ad-' + ad.ad_id}
          >
            {ad.image ? (
              <div className="relative overflow-hidden rounded-3xl">
                <img
                  src={resolveImg(ad.image)}
                  alt={ad.title || 'Anúncio'}
                  className="w-full object-cover h-[170px] md:h-[240px]"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {ad.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-lg font-bold tracking-wide">
                      {ad.title}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 bg-[#0B0D12] rounded-3xl">
                <p className="text-white text-lg font-bold">
                  {ad.title}
                </p>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
