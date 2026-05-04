import { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, Save, Sparkles, RotateCcw, Eye, EyeOff, MapPin, Heart, Star } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PRESET_THEMES = {
  brane_premium: {
    name: 'BRANE Premium (padrão)', primary_color: '#D4A24C', title_color: '#D4A24C',
    page_bg: '#050608', navbar_bg: '#050608', navbar_text: '#F7F7FA',
    nav_link_color: '#A6A8B3', nav_link_hover_color: '#D4A24C', menu_text_color: '#F7F7FA',
    category_text_color: '#F7F7FA', category_bg_color: '#0B0D12',
    card_bg: '#0B0D12', card_border: '#1E2230', card_hover_border: '#D4A24C', product_title_color: '#F7F7FA',
    price_color: '#D4A24C', price_cents_color: '#D4A24C',
    button_color: '#FFF3C4', button_text_color: '#0F1111', buy_now_color: '#6D28D9',
    star_color: '#D4A24C', free_shipping_color: '#10A875',
  },
  amazon: {
    name: 'Clean Light', primary_color: '#FF9900', title_color: '#131921',
    page_bg: '#EAEDED', navbar_bg: '#131921', navbar_text: '#FFFFFF',
    nav_link_color: '#CCCCCC', nav_link_hover_color: '#FF9900', menu_text_color: '#FFFFFF',
    category_text_color: '#131921', category_bg_color: '#FFFFFF',
    card_bg: '#FFFFFF', card_border: '#DDDDDD', card_hover_border: '#FF9900', product_title_color: '#0F1111',
    price_color: '#0F1111', price_cents_color: '#0F1111',
    button_color: '#FFD814', button_text_color: '#0F1111', buy_now_color: '#FFA41C',
    star_color: '#FFA41C', free_shipping_color: '#067D62',
  },
  shopee: {
    name: 'Orange Vibes', primary_color: '#EE4D2D', title_color: '#EE4D2D',
    page_bg: '#F5F5F5', navbar_bg: '#EE4D2D', navbar_text: '#FFFFFF',
    nav_link_color: '#FFFFFF', nav_link_hover_color: '#FFE5E0', menu_text_color: '#FFFFFF',
    category_text_color: '#222222', category_bg_color: '#FFFFFF',
    card_bg: '#FFFFFF', card_border: '#E5E5E5', card_hover_border: '#EE4D2D', product_title_color: '#222222',
    price_color: '#EE4D2D', price_cents_color: '#EE4D2D',
    button_color: '#EE4D2D', button_text_color: '#FFFFFF', buy_now_color: '#FF6F61',
    star_color: '#FFB800', free_shipping_color: '#26AA99',
  },
  midnight: {
    name: 'Midnight Neon', primary_color: '#8B5CF6', title_color: '#A78BFA',
    page_bg: '#0B0B14', navbar_bg: '#121223', navbar_text: '#E9E9FF',
    nav_link_color: '#A0A0C5', nav_link_hover_color: '#C4B5FD', menu_text_color: '#E9E9FF',
    category_text_color: '#E9E9FF', category_bg_color: '#1C1C2E',
    card_bg: '#121223', card_border: '#2A2A4A', card_hover_border: '#A78BFA', product_title_color: '#E9E9FF',
    price_color: '#A78BFA', price_cents_color: '#A78BFA',
    button_color: '#8B5CF6', button_text_color: '#FFFFFF', buy_now_color: '#EC4899',
    star_color: '#FBBF24', free_shipping_color: '#34D399',
  },
};

const SHAPE_OPTIONS = [
  { v: 'rounded', l: 'Arredondado', desc: 'Cantos suaves (padrão)' },
  { v: 'square',  l: 'Quadrado',    desc: 'Cantos retos' },
  { v: 'circle',  l: 'Redondo',     desc: 'Imagem circular' },
  { v: 'minimal', l: 'Minimalista', desc: 'Sem bordas nem fundo' },
];
const SIZE_OPTIONS = [
  { v: 'small', l: 'Pequeno', desc: 'Mais produtos/linha' },
  { v: 'medium', l: 'Médio', desc: 'Equilibrado (padrão)' },
  { v: 'large', l: 'Grande', desc: 'Destaque visual' },
];
const RATIO_OPTIONS = [
  { v: 'square', l: 'Quadrado 1:1' },
  { v: 'portrait', l: 'Retrato 3:4' },
  { v: 'landscape', l: 'Paisagem 4:3' },
  { v: 'auto', l: 'Automático' },
];
const COLS_OPTIONS = [
  { v: '2', l: '2 colunas' },
  { v: '3', l: '3 colunas' },
  { v: '4', l: '4 colunas' },
  { v: '5', l: '5 colunas' },
  { v: '6', l: '6 colunas' },
];

const COLOR_FIELDS = [
  { section: 'Navbar & Menus', fields: [
    ['navbar_bg','Fundo da Navbar'],
    ['navbar_text','Texto da Navbar'],
    ['nav_link_color','Links de navegação'],
    ['nav_link_hover_color','Links no hover'],
    ['menu_text_color','Texto do menu'],
  ]},
  { section: 'Página & Títulos', fields: [
    ['page_bg','Fundo da página'],
    ['title_color','Cor dos títulos'],
    ['primary_color','Cor primária'],
  ]},
  { section: 'Categorias', fields: [
    ['category_text_color','Texto'],
    ['category_bg_color','Fundo'],
  ]},
  { section: 'Card de Produto', fields: [
    ['card_bg','Fundo do card'],
    ['card_border','Borda do card'],
    ['card_hover_border','Borda no hover'],
    ['product_title_color','Título do produto'],
  ]},
  { section: 'Preço & Detalhes', fields: [
    ['price_color','Cor do preço'],
    ['price_cents_color','Cor dos centavos'],
    ['star_color','Estrelas'],
    ['free_shipping_color','Frete grátis'],
  ]},
  { section: 'Botões', fields: [
    ['button_color','Fundo: Adicionar'],
    ['button_text_color','Texto: Adicionar'],
    ['buy_now_color','Fundo: Comprar Agora'],
  ]},
];

export default function PersonalizationModule({ token }) {
  const { refreshTheme } = useTheme() || {};
  const [t, setT] = useState({});
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/theme`, { headers: h })
      .then(r => setT(r.data || {}))
      .catch(() => toast.error('Erro ao carregar tema'));
  }, []);

  const upd = (k, v) => setT(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/theme`, t, { headers: h });
      if (refreshTheme) refreshTheme();
      toast.success('Personalização aplicada!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const applyPreset = (key) => {
    const preset = PRESET_THEMES[key];
    if (!preset) return;
    const { name, ...colors } = preset;
    setT(prev => ({ ...prev, ...colors }));
    toast.success(`Preset "${name}" carregado. Clique em Salvar para aplicar.`);
  };

  return (
    <div className="space-y-5" data-testid="personalization-module">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="brane-label mb-1">Personalização</p>
          <h3 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#D4A24C]" /> Aparência da plataforma
          </h3>
          <p className="text-xs text-[#A6A8B3] mt-1">Configure cores, tamanhos e formato dos produtos. Preview ao vivo na direita.</p>
        </div>
        <button onClick={save} disabled={saving} className="brane-btn-primary" data-testid="save-personalization">
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar e aplicar'}
        </button>
      </div>

      {/* Presets */}
      <div className="brane-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#D4A24C]" />
          <span className="text-sm font-semibold text-white">Presets rápidos</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESET_THEMES).map(([k, v]) => (
            <button key={k} onClick={() => applyPreset(k)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#11131A] border border-[#1E2230] text-[#E6E6EA] hover:border-[#D4A24C] hover:text-[#D4A24C] transition"
              data-testid={`preset-${k}`}>
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        {/* LEFT — controls */}
        <div className="space-y-4">
          <Tabs defaultValue="layout">
            <TabsList className="bg-[#0B0D12] border border-[#1E2230] rounded-xl p-1 mb-3 flex flex-wrap h-auto">
              <TabsTrigger value="layout" className="data-[state=active]:bg-[#D4A24C] data-[state=active]:text-black text-[#A6A8B3]" data-testid="ptab-layout">Layout</TabsTrigger>
              <TabsTrigger value="colors" className="data-[state=active]:bg-[#D4A24C] data-[state=active]:text-black text-[#A6A8B3]" data-testid="ptab-colors">Cores</TabsTrigger>
              <TabsTrigger value="branding" className="data-[state=active]:bg-[#D4A24C] data-[state=active]:text-black text-[#A6A8B3]" data-testid="ptab-branding">Marca</TabsTrigger>
              <TabsTrigger value="display" className="data-[state=active]:bg-[#D4A24C] data-[state=active]:text-black text-[#A6A8B3]" data-testid="ptab-display">Exibição</TabsTrigger>
            </TabsList>

            {/* LAYOUT: shape, size, ratio, cols */}
            <TabsContent value="layout" className="space-y-4">
              <div className="brane-card p-5">
                <h4 className="text-sm font-semibold text-white mb-1">Formato dos produtos</h4>
                <p className="text-xs text-[#A6A8B3] mb-3">Escolha o estilo visual do card.</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_OPTIONS.map(s => (
                    <button key={s.v} onClick={() => upd('product_card_shape', s.v)}
                      className={`p-3 rounded-xl border text-left transition ${t.product_card_shape === s.v ? 'border-[#D4A24C] bg-[#D4A24C]/10' : 'border-[#1E2230] hover:border-[#D4A24C]/40'}`}
                      data-testid={`shape-${s.v}`}>
                      <p className="text-sm font-semibold text-white">{s.l}</p>
                      <p className="text-xs text-[#A6A8B3]">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="brane-card p-5">
                <h4 className="text-sm font-semibold text-white mb-1">Tamanho do card</h4>
                <p className="text-xs text-[#A6A8B3] mb-3">Define proporções globais do produto.</p>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_OPTIONS.map(s => (
                    <button key={s.v} onClick={() => upd('product_card_size', s.v)}
                      className={`p-3 rounded-xl border text-center transition ${t.product_card_size === s.v ? 'border-[#D4A24C] bg-[#D4A24C]/10' : 'border-[#1E2230] hover:border-[#D4A24C]/40'}`}
                      data-testid={`size-${s.v}`}>
                      <p className="text-sm font-semibold text-white">{s.l}</p>
                      <p className="text-[10px] text-[#A6A8B3]">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="brane-card p-5">
                <h4 className="text-sm font-semibold text-white mb-1">Proporção da imagem</h4>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {RATIO_OPTIONS.map(r => (
                    <button key={r.v} onClick={() => upd('product_image_ratio', r.v)}
                      className={`py-2 rounded-lg border text-sm font-medium transition ${t.product_image_ratio === r.v ? 'border-[#D4A24C] bg-[#D4A24C]/10 text-[#D4A24C]' : 'border-[#1E2230] text-[#A6A8B3] hover:border-[#D4A24C]/40'}`}
                      data-testid={`ratio-${r.v}`}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="brane-card p-5">
                <h4 className="text-sm font-semibold text-white mb-1">Colunas no grid</h4>
                <p className="text-xs text-[#A6A8B3] mb-3">Quantos produtos por linha no desktop.</p>
                <div className="flex flex-wrap gap-2">
                  {COLS_OPTIONS.map(c => (
                    <button key={c.v} onClick={() => upd('product_grid_columns', c.v)}
                      className={`px-4 py-2 rounded-full border text-xs font-semibold transition ${(t.product_grid_columns || '4') === c.v ? 'border-[#D4A24C] bg-[#D4A24C] text-black' : 'border-[#1E2230] text-[#A6A8B3] hover:border-[#D4A24C]/40'}`}
                      data-testid={`cols-${c.v}`}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* COLORS */}
            <TabsContent value="colors" className="space-y-4">
              {COLOR_FIELDS.map(group => (
                <div key={group.section} className="brane-card p-5">
                  <h4 className="text-sm font-semibold text-white mb-3">{group.section}</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {group.fields.map(([field, label]) => (
                      <ColorRow key={field} label={label} value={t[field]} onChange={v => upd(field, v)} field={field} />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* BRANDING */}
            <TabsContent value="branding" className="space-y-4">
              <div className="brane-card p-5 space-y-3">
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Nome da plataforma</Label>
                  <Input value={t.platform_name || ''} onChange={e => upd('platform_name', e.target.value)} className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" data-testid="brand-name" />
                </div>
                <div>
                  <Label className="text-[#A6A8B3] text-xs uppercase tracking-wider">Slogan</Label>
                  <Input value={t.platform_slogan || ''} onChange={e => upd('platform_slogan', e.target.value)} className="mt-1.5 bg-[#11131A] border-[#1E2230] text-white" data-testid="brand-slogan" />
                </div>
              </div>
            </TabsContent>

            {/* DISPLAY toggles */}
            <TabsContent value="display" className="space-y-4">
              <div className="brane-card p-5 space-y-3">
                <ToggleRow label="Mostrar estrelas" checked={t.show_stars !== false} onChange={v => upd('show_stars', v)} testId="toggle-stars" />
                <ToggleRow label="Mostrar frete grátis" checked={t.show_free_shipping !== false} onChange={v => upd('show_free_shipping', v)} testId="toggle-shipping" />
                <ToggleRow label="Mostrar parcelamento" checked={t.show_installments !== false} onChange={v => upd('show_installments', v)} testId="toggle-installments" />
                {t.show_installments !== false && (
                  <div className="flex items-center gap-3 pt-2">
                    <Label className="text-[#E6E6EA] text-sm">Parcelas em até:</Label>
                    <select value={t.installment_count || 12} onChange={e => upd('installment_count', Number(e.target.value))}
                      className="h-9 px-3 rounded bg-[#11131A] border border-[#1E2230] text-white text-sm" data-testid="installment-count">
                      {[3,6,10,12,18,24].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
                <ToggleRow label="Mostrar ícones nas categorias" checked={t.show_category_icons !== false} onChange={v => upd('show_category_icons', v)} testId="toggle-cat-icons" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT — Live preview */}
        <div className="lg:sticky lg:top-5 self-start">
          <div className="brane-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#D4A24C]" />
              <span className="text-sm font-semibold text-white">Preview ao vivo</span>
            </div>

            <LivePreview t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange, field }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#11131A] border border-[#1E2230]">
      <input
        type="color" value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer border border-[#1E2230] bg-transparent"
        data-testid={`color-${field}`}
      />
      <div className="flex-1 min-w-0">
        <Label className="text-[#A6A8B3] text-[10px] uppercase tracking-wider">{label}</Label>
        <Input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent border-0 p-0 h-6 text-xs text-white font-mono focus-visible:ring-0"
          data-testid={`color-input-${field}`}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, testId }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-[#11131A] border border-[#1E2230]">
      <span className="text-sm text-[#E6E6EA]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
    </label>
  );
}

/* ------------- Preview rendering the chosen theme ------------- */
function LivePreview({ t }) {
  const shape = t.product_card_shape || 'rounded';
  const size = t.product_card_size || 'medium';
  const ratioMap = { square: '1 / 1', portrait: '3 / 4', landscape: '4 / 3', auto: 'auto' };
  const sizeMap = {
    small:  { pad: 10, title: 12, price: 16, min: 210 },
    medium: { pad: 14, title: 14, price: 20, min: 280 },
    large:  { pad: 18, title: 16, price: 24, min: 340 },
  };
  const shapeMap = {
    rounded: { card: 16, img: 12 },
    square:  { card: 4,  img: 0 },
    circle:  { card: 24, img: 999 },
    minimal: { card: 0,  img: 0 },
  };
  const sz = sizeMap[size];
  const sh = shapeMap[shape];
  const ratio = ratioMap[t.product_image_ratio || 'square'];
  const bgPage = t.page_bg || '#050608';
  const navbarBg = t.navbar_bg || '#050608';
  const navbarText = t.navbar_text || '#F7F7FA';
  const catBg = t.category_bg_color || '#0B0D12';
  const catText = t.category_text_color || '#F7F7FA';
  const cardBg = t.card_bg || '#0B0D12';
  const cardBorder = t.card_border || '#1E2230';
  const titleColor = t.product_title_color || '#F7F7FA';
  const priceColor = t.price_color || '#D4A24C';
  const priceCents = t.price_cents_color || priceColor;
  const starColor = t.star_color || '#D4A24C';
  const shippingColor = t.free_shipping_color || '#10A875';
  const buttonBg = t.button_color || '#FFF3C4';
  const buttonText = t.button_text_color || '#0F1111';
  const buyBg = t.buy_now_color || '#6D28D9';

  const minimal = shape === 'minimal';

  return (
    <div className="rounded-xl overflow-hidden border border-[#1E2230]" style={{ backgroundColor: bgPage }}>
      {/* fake navbar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: navbarBg, color: navbarText, borderBottom: '1px solid #1E2230' }}>
        <span className="font-bold text-sm" style={{ color: t.title_color || priceColor }}>{t.platform_name || 'BRANE'}</span>
        <div className="flex gap-3 text-xs">
          <span style={{ color: t.nav_link_color || '#A6A8B3' }}>Ofertas</span>
          <span style={{ color: t.nav_link_color || '#A6A8B3' }}>Categorias</span>
          <span style={{ color: t.nav_link_color || '#A6A8B3' }}>Novidades</span>
        </div>
      </div>

      {/* categories row */}
      <div className="px-4 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {['Eletrônicos', 'Moda', 'Casa', 'Esportes'].map(c => (
            <span key={c} className="text-[10px] px-3 py-1.5 rounded-lg border" style={{ backgroundColor: catBg, color: catText, borderColor: cardBorder }}>{c}</span>
          ))}
        </div>
      </div>

      {/* product grid 2 cols */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i}
            className="overflow-hidden transition"
            style={{
              backgroundColor: minimal ? 'transparent' : cardBg,
              border: minimal ? 0 : `1px solid ${cardBorder}`,
              borderRadius: sh.card,
              minHeight: sz.min,
              display: 'flex', flexDirection: 'column'
            }}>
            <div style={{
              aspectRatio: ratio,
              background: '#050608',
              borderRadius: shape === 'circle' ? '50%' : `${sh.img}px ${sh.img}px 0 0`,
              margin: shape === 'circle' ? '12px auto 0' : 0,
              width: shape === 'circle' ? 'calc(100% - 24px)' : '100%',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4F525B', fontSize: 10,
            }}>
              IMG
              <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center" style={{ color: '#fff' }}>
                <Heart className="w-3 h-3" />
              </button>
            </div>
            <div style={{ padding: sz.pad, textAlign: shape === 'circle' ? 'center' : 'left', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <p style={{ color: titleColor, fontSize: sz.title, lineHeight: 1.3 }}>Exemplo de produto #{i}</p>
              {t.show_stars !== false && (
                <div className="flex gap-0.5" style={{ justifyContent: shape === 'circle' ? 'center' : 'flex-start' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3" style={{ color: starColor, fill: starColor }} />)}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: shape === 'circle' ? 'center' : 'flex-start' }}>
                <span style={{ color: priceColor, fontSize: 10, fontWeight: 600 }}>R$</span>
                <span style={{ color: priceColor, fontSize: sz.price, fontWeight: 800 }}>99</span>
                <span style={{ color: priceCents, fontSize: sz.price * 0.6, fontWeight: 700 }}>,90</span>
              </div>
              {t.show_installments !== false && (
                <p style={{ color: '#A6A8B3', fontSize: 10 }}>em até {t.installment_count || 12}x</p>
              )}
              {t.show_free_shipping !== false && (
                <p style={{ color: shippingColor, fontSize: 10, fontWeight: 700 }}>Frete grátis</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6F7280', fontSize: 10, marginTop: 'auto' }}>
                <MapPin className="w-3 h-3" /> São Paulo
              </div>
              <div className="flex gap-1 mt-1">
                <button className="flex-1 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: buttonBg, color: buttonText, border: `1px solid ${buttonBg}` }}>Carrinho</button>
                <button className="flex-1 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: buyBg }}>Comprar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
