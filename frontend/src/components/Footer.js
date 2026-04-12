import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-12 mt-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#B38B36] mb-3 font-['Outfit']">BRANE</h3>
            <p className="text-sm text-gray-400">Escolhas que constroem o futuro. Marketplace premium para comprar, vender e ganhar como afiliado.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36]">Links</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/products" className="hover:text-white">Produtos</Link>
              <Link to="/pages/about" className="hover:text-white">Sobre</Link>
              <Link to="/pages/faq" className="hover:text-white">FAQ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36]">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/pages/termos" className="hover:text-white">Termos de Uso</Link>
              <Link to="/pages/privacidade" className="hover:text-white">Privacidade</Link>
              <Link to="/pages/contato" className="hover:text-white">Contato</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-[#B38B36]">Marketplace</h4>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/auth" className="hover:text-white">Seja Vendedor</Link>
              <Link to="/auth" className="hover:text-white">Seja Afiliado</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          BRANE Marketplace &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
