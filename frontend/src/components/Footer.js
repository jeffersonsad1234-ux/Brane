import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Instagram, Phone, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from './ui/button';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A]" data-testid="footer">
      {/* Support Banner */}
      <div className="bg-gradient-to-r from-[#B38B36]/10 to-[#B38B36]/5 border-b border-[#B38B36]/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B38B36]/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#B38B36]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Precisa de ajuda?</p>
                <p className="text-[#888] text-xs">Nossa equipe está pronta para te atender</p>
              </div>
            </div>
            <Link to="/support">
              <Button className="gold-btn rounded-lg px-6 py-2 text-sm font-medium">
                <MessageCircle className="w-4 h-4 mr-2" /> Falar com Suporte
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Features Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 pb-10 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Compra Segura</p>
                <p className="text-[#666] text-xs">Proteção ao comprador</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Ganhe Comissões</p>
                <p className="text-[#666] text-xs">6.5% como afiliado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Comunidade</p>
                <p className="text-[#666] text-xs">Milhares de vendedores</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-bold text-[#B38B36] mb-4 font-['Outfit']">BRANE</h3>
              <p className="text-sm text-[#666] leading-relaxed">Escolhas que constroem o futuro. Marketplace premium para comprar, vender e ganhar como afiliado.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#B38B36] text-sm">Links</h4>
              <div className="flex flex-col gap-2 text-sm text-[#666]">
                <Link to="/products" className="hover:text-[#B38B36] transition-colors">Produtos</Link>
                <Link to="/pages/about" className="hover:text-[#B38B36] transition-colors">Sobre Nós</Link>
                <Link to="/pages/faq" className="hover:text-[#B38B36] transition-colors">Perguntas Frequentes</Link>
                <Link to="/pages/como-funciona" className="hover:text-[#B38B36] transition-colors">Como Funciona</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#B38B36] text-sm">Legal</h4>
              <div className="flex flex-col gap-2 text-sm text-[#666]">
                <Link to="/pages/termos" className="hover:text-[#B38B36] transition-colors">Termos de Uso</Link>
                <Link to="/pages/privacidade" className="hover:text-[#B38B36] transition-colors">Política de Privacidade</Link>
                <Link to="/pages/politica-reembolso" className="hover:text-[#B38B36] transition-colors">Política de Reembolso</Link>
                <Link to="/pages/contato" className="hover:text-[#B38B36] transition-colors">Contato</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#B38B36] text-sm">Participe</h4>
              <div className="flex flex-col gap-2 text-sm text-[#666]">
                <Link to="/auth" className="hover:text-[#B38B36] transition-colors">Seja Vendedor</Link>
                <Link to="/auth" className="hover:text-[#B38B36] transition-colors">Seja Afiliado</Link>
                <Link to="/auth" className="hover:text-[#B38B36] transition-colors">Criar Conta</Link>
              </div>
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#666] hover:text-[#B38B36] hover:bg-[#B38B36]/10 transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#666] hover:text-[#B38B36] hover:bg-[#B38B36]/10 transition-all">
                  <Mail className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#666] hover:text-[#B38B36] hover:bg-[#B38B36]/10 transition-all">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-[#1A1A1A] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#444]">
              BRANE &copy; {new Date().getFullYear()}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-[#444]">
              Feito com <span className="text-[#B38B36]">♥</span> para você
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
