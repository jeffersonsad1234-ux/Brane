import { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ShareButtons - Reusable share/copy link buttons for products and stores.
 * Generates a public URL and provides Copy + Native Share buttons.
 *
 * Props:
 *  - path: string e.g. "/products/abc123" or "/stores/my-store"
 *  - title: string - title for native share
 *  - text: string - description for native share
 *  - variant: "default" | "compact" (smaller buttons)
 */
export default function ShareButtons({ path, title = 'Confira na BRANE', text = '', variant = 'default' }) {
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const origin = (typeof window !== 'undefined' && window.location?.origin) || '';
    const cleanPath = path?.startsWith('/') ? path : `/${path || ''}`;
    return `${origin}${cleanPath}`;
  };

  const copyLink = async () => {
    const url = buildUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Não foi possível copiar');
      }
    }
  };

  const shareNative = async () => {
    const url = buildUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled - silent
      }
    } else {
      copyLink();
    }
  };

  const isCompact = variant === 'compact';
  const sizeCls = isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const iconSize = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-2" data-testid="share-buttons">
      <button
        type="button"
        onClick={copyLink}
        className={`${sizeCls} rounded-lg bg-[#1E2230] hover:bg-[#2A2C36] text-white border border-[#2A2C36] hover:border-[#D4A24C]/40 flex items-center gap-1.5 transition-all`}
        data-testid="copy-link-btn"
        title="Copiar link"
      >
        {copied ? <Check className={`${iconSize} text-green-400`} /> : <Copy className={iconSize} />}
        <span>{copied ? 'Copiado' : 'Copiar link'}</span>
      </button>
      <button
        type="button"
        onClick={shareNative}
        className={`${sizeCls} rounded-lg bg-[#D4A24C] hover:bg-[#E8C372] text-black font-semibold flex items-center gap-1.5 transition-all`}
        data-testid="share-btn"
        title="Compartilhar"
      >
        <Share2 className={iconSize} />
        <span>Compartilhar</span>
      </button>
    </div>
  );
}
