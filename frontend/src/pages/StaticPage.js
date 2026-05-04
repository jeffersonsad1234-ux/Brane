import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/pages/${slug}`).then(res => setPage(res.data)).catch(() => {}).finally(() => setLoading(false)); }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center carbon-bg"><div className="w-8 h-8 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen carbon-bg py-8" data-testid="static-page">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-white mb-6 capitalize">{page?.title || slug}</h1>
        <div className="dark-card rounded-xl p-6">
          {page?.content ? (
            <div className="text-[#E6E6EA] leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br/>') }} />
          ) : (
            <p className="text-[#A6A8B3]">Conteudo em breve.</p>
          )}
        </div>
      </div>
    </div>
  );
}
