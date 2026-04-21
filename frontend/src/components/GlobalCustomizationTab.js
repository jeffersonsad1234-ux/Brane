import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCustomization } from '../contexts/CustomizationContext';
import { Palette, Grid, User, Megaphone, Save, Image, X, Eye, MousePointer, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ColorField({ label, field, values, setValues }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={values[field] || '#000000'}
        onChange={e => setValues({ ...values, [field]: e.target.value })}
        className="w-10 h-10 rounded cursor-pointer border border-purple-500/30 bg-transparent"
      />
      <div className="flex-1">
        <label className="text-xs text-[#C4B5FD]">{label}</label>
        <input
          value={values[field] || ''}
          onChange={e => setValues({ ...values, [field]: e.target.value })}
          className="social-input w-full px-2 py-1 text-xs mt-0.5"
        />
      </div>
    </div>
  );
}

export default function GlobalCustomizationTab({ token }) {
  const { refresh: refreshCustom } = useCustomization();
  const [tab, setTab] = useState('social');
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  const [ads, setAds] = useState([]);
  const [adForm, setAdForm] = useState({ title: '', body: '', image: '', link: '', cta: 'Saiba mais' });
  const [showAdForm, setShowAdForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/customization`, { headers: h, withCredentials: true })
      .then(r => setValues(r.data))
      .catch(() => {});
    fetchAds();
  }, []);

  const fetchAds = () => axios.get(`${API}/admin/social/ads`, { headers: h, withCredentials: true }).then(r => setAds(r.data.ads)).catch(() => {});

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/customization`, values, { headers: h, withCredentials: true });
      refreshCustom();
      toast.success('Personalização global salva!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const uploadAdImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await axios.post(`${API}/upload`, fd, { headers: h, withCredentials: true });
      setAdForm({ ...adForm, image: r.data.path });
      toast.success('Imagem enviada!');
    } catch { toast.error('Erro no upload'); }
    finally { setUploading(false); }
  };

  const createAd = async () => {
    if (!adForm.title || !adForm.image || !adForm.link) return toast.error('Preencha título, imagem e link');
    try {
      await axios.post(`${API}/admin/social/ads`, adForm, { headers: h, withCredentials: true });
      toast.success('Anúncio social criado!');
      setAdForm({ title: '', body: '', image: '', link: '', cta: 'Saiba mais' });
      setShowAdForm(false);
      fetchAds();
    } catch { toast.error('Erro ao criar anúncio'); }
  };

  const toggleAd = async (id, active) => {
    try {
      await axios.put(`${API}/admin/social/ads/${id}`, { active }, { headers: h, withCredentials: true });
      fetchAds();
    } catch {}
  };

  const deleteAd = async (id) => {
    if (!window.confirm('Remover anúncio?')) return;
    try {
      await axios.delete(`${API}/admin/social/ads/${id}`, { headers: h, withCredentials: true });
      toast.success('Removido');
      fetchAds();
    } catch {}
  };

  const mediaUrl = (p) => !p ? '' : p.startsWith('http') ? p : `${API}/files/${p}`;

  return (
    <div className="max-w-4xl space-y-6" data-testid="admin-customization-tab">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 bg-[#14141F] p-1 rounded-xl border border-purple-500/20">
        {[
          { id: 'social', label: 'Rede Social', icon: Palette },
          { id: 'marketplace', label: 'Marketplace', icon: Grid },
          { id: 'profile', label: 'Perfis', icon: User },
          { id: 'ads', label: 'Anúncios Sociais', icon: Megaphone },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${tab === t.id ? 'bg-purple-600 text-white' : 'text-[#C4B5FD] hover:bg-purple-500/10'}`}
              data-testid={`custom-subtab-${t.id}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* SOCIAL COLORS */}
      {tab === 'social' && (
        <div className="space-y-4">
          <div className="social-card p-5" data-testid="custom-social-colors">
            <h3 className="social-title text-lg mb-4">Cores da Rede Social</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <ColorField label="Cor primária do sistema" field="social_primary" values={values} setValues={setValues} />
              <ColorField label="Cor de acento" field="social_accent" values={values} setValues={setValues} />
              <ColorField label="Fundo principal" field="social_bg" values={values} setValues={setValues} />
              <ColorField label="Fundo de cards/painéis" field="social_surface" values={values} setValues={setValues} />
              <ColorField label="Cor dos textos" field="social_text" values={values} setValues={setValues} />
              <ColorField label="Cor de textos secundários" field="social_muted" values={values} setValues={setValues} />
              <ColorField label="Cor dos botões" field="social_button" values={values} setValues={setValues} />
              <ColorField label="Texto dos botões" field="social_button_text" values={values} setValues={setValues} />
              <ColorField label="Cor dos nomes de usuários" field="username_color" values={values} setValues={setValues} />
              <ColorField label="Cor dos títulos" field="title_color" values={values} setValues={setValues} />
              <ColorField label="Cor do menu" field="menu_color" values={values} setValues={setValues} />
            </div>
          </div>

          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Tema</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#C4B5FD]">Modo</label>
                <select
                  value={values.theme_mode || 'dark'}
                  onChange={e => setValues({ ...values, theme_mode: e.target.value })}
                  className="social-input w-full px-3 py-2 text-sm mt-1"
                  data-testid="theme-mode-select"
                >
                  <option value="dark">Escuro (Premium)</option>
                  <option value="light">Claro</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[#C4B5FD]">Contraste</label>
                <select
                  value={values.contrast_level || 'normal'}
                  onChange={e => setValues({ ...values, contrast_level: e.target.value })}
                  className="social-input w-full px-3 py-2 text-sm mt-1"
                  data-testid="contrast-select"
                >
                  <option value="low">Baixo</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Pré-visualização</h3>
            <div className="rounded-xl p-4" style={{ background: values.social_bg, color: values.social_text }}>
              <div className="rounded-xl p-4" style={{ background: values.social_surface, border: `1px solid ${values.social_primary}30` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: `linear-gradient(135deg, ${values.social_primary}, ${values.social_accent})` }} />
                  <div>
                    <p style={{ color: values.username_color, fontWeight: 600 }}>Usuário Exemplo</p>
                    <p className="text-xs" style={{ color: values.social_muted }}>agora</p>
                  </div>
                </div>
                <p style={{ color: values.social_text }} className="mb-3">Este é um post de exemplo para ver as cores aplicadas.</p>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: values.social_button, color: values.social_button_text }}>
                  Curtir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARKETPLACE LAYOUT */}
      {tab === 'marketplace' && (
        <div className="space-y-4" data-testid="custom-marketplace">
          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Tamanho dos Cards de Produtos</h3>
            <div className="grid grid-cols-4 gap-3">
              {['small', 'medium', 'large', 'custom'].map(s => (
                <button
                  key={s}
                  onClick={() => setValues({ ...values, card_size: s })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                    values.card_size === s ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-purple-900/30 text-[#9CA3AF] hover:border-purple-500/50'
                  }`}
                  data-testid={`card-size-${s}`}
                >
                  {s === 'small' ? 'Pequeno' : s === 'medium' ? 'Médio' : s === 'large' ? 'Grande' : 'Personalizado'}
                </button>
              ))}
            </div>
            {values.card_size === 'custom' && (
              <div className="mt-4">
                <label className="text-sm text-[#C4B5FD]">Tamanho personalizado: {values.card_size_custom || 240}px</label>
                <input
                  type="range"
                  min="160"
                  max="400"
                  value={values.card_size_custom || 240}
                  onChange={e => setValues({ ...values, card_size_custom: Number(e.target.value) })}
                  className="w-full mt-2 accent-purple-500"
                  data-testid="card-size-custom-slider"
                />
              </div>
            )}
          </div>

          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Produtos por Linha</h3>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setValues({ ...values, products_per_row: n })}
                  className={`p-4 rounded-xl border-2 text-lg font-bold transition-all ${
                    values.products_per_row === n ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-purple-900/30 text-[#9CA3AF] hover:border-purple-500/50'
                  }`}
                  data-testid={`products-per-row-${n}`}
                >
                  {n} produtos
                </button>
              ))}
            </div>
          </div>

          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Pré-visualização</h3>
            <div className="marketplace-grid" style={{ '--products-per-row': values.products_per_row || 4 }}>
              {[...Array(values.products_per_row || 4)].map((_, i) => (
                <div key={i} className="rounded-lg border" style={{ background: '#14141F', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
                  <div className="aspect-square bg-[#0a0a0f] rounded-t-lg flex items-center justify-center">
                    <div className="text-purple-500">📦</div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-white truncate">Produto {i + 1}</p>
                    <p className="text-xs text-purple-400 font-bold">R$ 99,90</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE CUSTOMIZATION */}
      {tab === 'profile' && (
        <div className="space-y-4" data-testid="custom-profile">
          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Personalização de Perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#C4B5FD]">Layout do Perfil</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['modern', 'classic', 'minimal'].map(l => (
                    <button
                      key={l}
                      onClick={() => setValues({ ...values, profile_layout: l })}
                      className={`p-3 rounded-lg border-2 text-sm capitalize transition-all ${
                        values.profile_layout === l ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-purple-900/30 text-[#9CA3AF]'
                      }`}
                      data-testid={`profile-layout-${l}`}
                    >
                      {l === 'modern' ? 'Moderno' : l === 'classic' ? 'Clássico' : 'Minimal'}
                    </button>
                  ))}
                </div>
              </div>

              <ColorField label="Cor de destaque do perfil" field="profile_accent" values={values} setValues={setValues} />
              <ColorField label="Cor dos nomes de usuários (global)" field="username_color" values={values} setValues={setValues} />
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL ADS MANAGEMENT */}
      {tab === 'ads' && (
        <div className="space-y-4" data-testid="custom-ads">
          <div className="social-card p-5">
            <h3 className="social-title text-lg mb-4">Configurações de Anúncios</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#C4B5FD]">Anúncios habilitados no feed</label>
                <input
                  type="checkbox"
                  checked={values.social_ads_enabled !== false}
                  onChange={e => setValues({ ...values, social_ads_enabled: e.target.checked })}
                  className="w-5 h-5 accent-purple-500"
                  data-testid="ads-enabled-toggle"
                />
              </div>
              <div>
                <label className="text-sm text-[#C4B5FD]">Frequência: a cada {values.social_ad_every || 5} posts</label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={values.social_ad_every || 5}
                  onChange={e => setValues({ ...values, social_ad_every: Number(e.target.value) })}
                  className="w-full mt-2 accent-purple-500"
                  data-testid="ad-frequency-slider"
                />
                <p className="text-xs text-[#6B6B7B] mt-1">Valores menores = mais anúncios. Valores maiores = experiência mais limpa.</p>
              </div>
            </div>
          </div>

          <div className="social-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="social-title text-lg">Anúncios Ativos</h3>
              <button onClick={() => setShowAdForm(!showAdForm)} className="social-btn px-3 py-1.5 text-xs" data-testid="toggle-ad-form">
                {showAdForm ? 'Cancelar' : '+ Novo Anúncio'}
              </button>
            </div>

            {showAdForm && (
              <div className="bg-[#0a0a0f]/60 rounded-xl p-4 mb-4 border border-purple-500/20">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={adForm.title}
                    onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                    placeholder="Título"
                    className="social-input px-3 py-2 text-sm"
                    data-testid="ad-title-input"
                  />
                  <input
                    value={adForm.link}
                    onChange={e => setAdForm({ ...adForm, link: e.target.value })}
                    placeholder="Link de destino (https://...)"
                    className="social-input px-3 py-2 text-sm"
                    data-testid="ad-link-input"
                  />
                  <textarea
                    value={adForm.body}
                    onChange={e => setAdForm({ ...adForm, body: e.target.value })}
                    placeholder="Descrição (opcional)"
                    rows={2}
                    className="social-input px-3 py-2 text-sm sm:col-span-2"
                    data-testid="ad-body-input"
                  />
                  <input
                    value={adForm.cta}
                    onChange={e => setAdForm({ ...adForm, cta: e.target.value })}
                    placeholder="Texto do botão (ex: Comprar agora)"
                    className="social-input px-3 py-2 text-sm"
                    data-testid="ad-cta-input"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/60 text-sm text-[#9CA3AF]">
                    <input type="file" accept="image/*" className="hidden" onChange={uploadAdImage} />
                    <Image className="w-4 h-4" /> {adForm.image ? 'Imagem enviada ✓' : (uploading ? 'Enviando...' : 'Imagem')}
                  </label>
                </div>
                <button onClick={createAd} className="social-btn w-full mt-3 py-2 text-sm" data-testid="create-ad-submit">
                  Criar Anúncio
                </button>
              </div>
            )}

            {ads.length === 0 ? (
              <p className="text-center text-[#6B6B7B] py-6 text-sm">Nenhum anúncio criado</p>
            ) : (
              <div className="space-y-2">
                {ads.map(a => (
                  <div key={a.ad_id} className="bg-[#0a0a0f]/60 rounded-xl p-3 flex items-center gap-3" data-testid={`ad-${a.ad_id}`}>
                    {a.image && <img src={mediaUrl(a.image)} alt="" className="w-20 h-14 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                      <p className="text-xs text-[#9CA3AF] truncate">{a.link}</p>
                      <div className="flex gap-3 mt-1 text-[10px] text-[#6B6B7B]">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views || 0}</span>
                        <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> {a.clicks || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleAd(a.ad_id, !a.active)} className={`px-2 py-1 text-xs rounded ${a.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {a.active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => deleteAd(a.ad_id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" data-testid={`delete-ad-${a.ad_id}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={save} disabled={saving} className="social-btn w-full py-3 text-base" data-testid="save-customization">
        <Save className="w-5 h-5 inline mr-2" /> {saving ? 'Salvando...' : 'Salvar Personalização Global'}
      </button>
    </div>
  );
}
