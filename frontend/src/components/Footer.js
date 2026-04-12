import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A] py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#B38B36] mb-3 font-['Outfit']">BRANE</h3>
            <p className="text-sm text-[#666]">Escolhas que constroem o futuro. Marketplace premium para comprar, vender e ganhar como afiliado.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36] text-sm">Links</h4>
            <div className="flex flex-col gap-2 text-sm text-[#666]">
              <Link to="/products" className="hover:text-[#B38B36]">Produtos</Link>
              <Link to="/pages/about" className="hover:text-[#B38B36]">Sobre</Link>
              <Link to="/pages/faq" className="hover:text-[#B38B36]">FAQ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36] text-sm">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-[#666]">
              <Link to="/pages/termos" className="hover:text-[#B38B36]">Termos de Uso</Link>
              <Link to="/pages/privacidade" className="hover:text-[#B38B36]">Privacidade</Link>
              <Link to="/pages/contato" className="hover:text-[#B38B36]">Contato</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36] text-sm">Marketplace</h4>
            <div className="flex flex-col gap-2 text-sm text-[#666]">
              <Link to="/auth" className="hover:text-[#B38B36]">Seja Vendedor</Link>
              <Link to="/auth" className="hover:text-[#B38B36]">Seja Afiliado</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#1A1A1A] mt-8 pt-6 text-center text-xs text-[#444]">
          BRANE &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
