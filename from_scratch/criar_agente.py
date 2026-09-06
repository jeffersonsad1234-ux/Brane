"""
BranPy AI — Comando rápido para criar agentes.

100% da branpy.com.br — Todos os direitos reservados.

Uso: python criar_agente.py "crie um agente que faça X"
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from meta_agent import MetaAgent


def main():
    if len(sys.argv) < 2:
        print("\nBranPy AI — Criador de Agentes")
        print("100% branpy.com.br\n")
        print("Uso:")
        print('  python criar_agente.py "crie um agente que colete dados de sites"')
        print('  python criar_agente.py "crie um bot que monitore meu PC"')
        print('  python criar_agente.py "crie um gerenciador de arquivos"')
        print("\nTemplates disponíveis:")
        meta = MetaAgent()
        for name, template in meta.templates.items():
            print(f"  • {name}: {template['description']}")
        return

    request = " ".join(sys.argv[1:])

    meta = MetaAgent()
    result = meta.create_agent(request)

    print(f"\n{'='*60}")
    print(f"AGENTE CRIADO COM SUCESSO!")
    print(f"{'='*60}")
    print(f"\nPara usar:")
    print(f"  cd {result}")
    print(f"  pip install -r requirements.txt")
    print(f"  python main.py")


if __name__ == '__main__':
    main()
