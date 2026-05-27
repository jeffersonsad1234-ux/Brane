import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Instagram, Facebook, Twitter, Globe, Mail, Send } from 'lucide-react';
import { BRANE_LOGO_URL } from './Navbar';
import AdSlot from './AdSlot';
import { useTranslation } from '../i18n/I18nContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SOCIAL_ICON_MAP = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  other: Globe,
};

const SOCIAL_LABEL_MAP = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  other: 'Site',
};

export default function Footer() {
  const { t } = useTranslation();
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    axios.get(`${API}/footer-config`)
      .then(res => {
        const links = res.data?.social_links || {};
        const list = Object.entries(links)
          .filter(([_, v]) => v && v.enabled && v.url && v.url.trim())
          .map(([key, v]) => ({
            key,
            url: v.url.trim(),
            label: v.label || SOCIAL_LABEL_MAP[key] || key,
            Icon: SOCIAL_ICON_MAP[key] || Globe,
          }));
        setSocialLinks(list);
      })
      .catch(() => setSocialLinks([]));
  }, []);

  return (
    <footer className="relative z-10 bg-[#050608] border-t border-[#1E2230]" data-testid="footer">
      {/* Footer Ad */}
      <div className="max-w-[1400px] mx-auto px-6 pt-8">
        <AdSlot position="footer" />
      </div>
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          {/* Brand + Newsletter */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-[#D4A24C]/30">
                <img src={BRANE_LOGO_URL} alt="Belivre" className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-sm text-[#A6A8B3] max-w-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <NewsletterForm />
          </div>

          <FooterCol title={t('footer.navigation')} links={[
            { label: t('footer.home'), to: '/' },
            { label: t('footer.explore'), to: '/products' },
            { label: t('footer.stores'), to: '/stores' },
            { label: t('footer.advertise'), to: '/add-product' },
          ]} />
          <FooterCol title={t('footer.support')} links={[
            { label: t('footer.aboutUs'), to: '/pages/sobre' },
            { label: t('footer.faq'), to: '/pages/faq' },
            { label: t('footer.contact'), to: '/pages/contato' },
            { label: t('footer.talkToSupport'), to: '/support' },
          ]} />
          <FooterCol title={t('footer.legal')} links={[
            { label: t('footer.terms'), to: '/pages/termos' },
            { label: t('footer.privacy'), to: '/pages/privacidade' },
            { label: t('footer.security'), to: '/pages/seguranca' },
          ]} />
        </div>

        <div className="mt-14 pt-6 border-t border-[#14171F] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6F7280]">&copy; {new Date().getFullYear()} Belivre. {t('footer.rights')}.</p>
          <div className="flex items-center gap-2">
            {socialLinks.length === 0 ? null : socialLinks.map(({ key, url, label, Icon }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-[#1E2230] flex items-center justify-center text-[#A6A8B3] hover:text-[#D4A24C] hover:border-[#D4A24C]/40 transition-all"
                data-testid={`footer-social-${key}`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error(t('footer.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      const r = await axios.post(`${API}/subscribers`, { email: v });
      toast.success(r.data?.message || t('footer.subscribeSuccess'));
      setEmail('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || t('footer.subscribeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2" data-testid="newsletter-form">
      <div className="flex items-center gap-2 text-sm text-white">
        <Mail className="w-4 h-4 text-[#D4A24C]" />
        <span className="font-semibold">{t('footer.newsletter')}</span>
      </div>
      <p className="text-xs text-[#6F7280]">{t('footer.subscribePrompt')}</p>
      <div className="flex gap-2 max-w-sm">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('footer.emailPlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg bg-[#0B0D12] border border-[#1E2230] text-white text-sm placeholder:text-[#4F525B] focus:outline-none focus:border-[#D4A24C] transition-colors"
          data-testid="newsletter-email-input"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#D4A24C] hover:bg-[#E8C372] text-black text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          data-testid="newsletter-submit-btn"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? '...' : t('footer.subscribe')}
        </button>
      </div>
    </form>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold mb-4 text-white text-sm">{title}</h4>
      <div className="flex flex-col gap-3 text-sm text-[#A6A8B3]">
        {links.map(l => (
          <Link key={l.to} to={l.to} className="hover:text-[#D4A24C] transition-colors">{l.label}</Link>
        ))}
      </div>
    </div>
  );
}
