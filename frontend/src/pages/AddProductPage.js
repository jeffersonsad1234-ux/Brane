import { useNavigate, useSearchParams } from "react-router-dom";
import { Store, ShoppingBag, Repeat } from "lucide-react";

export default function AddProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const storeId = searchParams.get("store_id") || "";
  const insideStore = Boolean(storeId);

  const goToFeed = () => {
    navigate("/add-product/feed");
  };

  const goToDesapega = () => {
    navigate("/add-product/desapega");
  };

  const goToStore = () => {
    navigate("/add-product/store");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">
          Adicionar Produto
        </h1>

        <p className="text-gray-400 mb-10">
          {insideStore
            ? "Publicar um produto dentro da sua loja"
            : "Escolha onde deseja publicar seu produto"}
        </p>

        {insideStore ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">
              Publicar na Loja
            </h2>

            <p className="text-gray-400 mb-8">
              Esse produto será publicado dentro da sua loja.
            </p>

            <button
              onClick={goToStore}
              className="bg-[#D4A24C] text-[#0B0B0F] px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Continuar cadastro
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            <button
              onClick={goToFeed}
              className="group text-left rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#D4A24C]/60 hover:bg-[#D4A24C]/10 transition-all"
            >
              <ShoppingBag className="w-9 h-9 text-[#D4A24C] mb-5" />

              <h2 className="text-xl font-bold mb-2">
                Publicar no Feed
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed">
                Produto aparece no feed principal da Marketplace para todos os usuários.
              </p>
            </button>

            <button
              onClick={goToDesapega}
              className="group text-left rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-orange-400/60 hover:bg-orange-400/10 transition-all"
            >
              <Repeat className="w-9 h-9 text-orange-400 mb-5" />

              <h2 className="text-xl font-bold mb-2">
                Publicar no Desapega
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed">
                Para produtos únicos, usados, seminovos ou ofertas especiais.
              </p>
            </button>

            <button
              onClick={goToStore}
              className="group text-left rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-purple-400/60 hover:bg-purple-400/10 transition-all"
            >
              <Store className="w-9 h-9 text-purple-400 mb-5" />

              <h2 className="text-xl font-bold mb-2">
                Publicar na Minha Loja
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed">
                Publique um produto diretamente dentro da sua loja.
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
