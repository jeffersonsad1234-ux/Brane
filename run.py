import uvicorn
from server.server import app

if __name__ == "__main__":
    print('')
    print('  ==============================================')
    print('        BRANPY API SERVER v1.0.0')
    print('        O servidor da sua IA propria!')
    print('  ==============================================')
    print('')
    print('  Endpointes:')
    print('    GET  /              - Status')
    print('    GET  /api/tags      - Modelos disponiveis')
    print('    POST /api/chat      - Chat')
    print('    POST /api/generate  - Geracao simples')
    print('    POST /api/load      - Carregar modelo')
    print('    GET  /api/health    - Saude do servidor')
    print('    GET  /api/training/status - Status do treino')
    print('    POST /api/training/start  - Iniciar treino')
    print('')
    print("  Para usar: inicie o treino em POST /api/training/start")
    print('  E envie requests pra http://127.0.0.1:11435')
    print('')
    uvicorn.run(app, host="127.0.0.1", port=11435)
