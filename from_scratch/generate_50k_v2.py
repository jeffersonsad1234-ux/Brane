"""
BRANPY AI -- GERADOR ADICIONAL 50K
Adiciona mais topicos e variacoes
"""
import os, random

OUTPUT = os.path.join(os.path.dirname(__file__), "data", "corpus_50k_adicional.txt")

MAIS_TOPICOS = {
    "seguranca_de_dados": [
        ("como proteger meus dados na internet", "Use senhas fortes (12+ caracteres, mistura). Ative 2FA. Nao clique em links suspeitos. Use VPN em redes publicas. Atualize software."),
        ("o que e phishing", "Golpe que finge ser empresa legitima pra roubar dados. Email/site falso. Verifique sempre URL, nao clique em links duvidosos."),
        ("como saber se fui hackeado", "Sinais: senha nao funciona, Activity estranha, email suspeito. Mude senhas, verifique dispositivos, ative 2FA."),
    ],
    "energia_renovavel": [
        ("o que e energia solar", "Painéis fotovoltaicos convertem luz solar em eletricidade. Brasil tem potencial enorme. Custos caíram 90% em 10 anos."),
        ("o que e energia eolica", "Turbinas captam vento pra gerar eletricidade. Brasil: nordeste e sul. Limpa e renovável."),
        ("o que e energia hidrelétrica", "Agua em movimento gera eletricidade. Brasil depende muito (60%). Itaipu: maior do mundo."),
    ],
    "cambio_climatico": [
        ("o que e cambio climatico", "Aquecimento global causado por gases estufa. CO2 da queima de combustíveis fósseis. Consequências: extremos, nivel do mar."),
        ("o que e aquecimento global", "Temperatura media da Terra subindo. Causa: atividade humana. Efeitos: derretimento de gelo, furacoes, secas."),
        ("como parar o aquecimento global", "Reduzir emissões: energia limpa, transporte elétrico, desmatamento zero. Acordo de Paris: limitar a 1.5°C."),
    ],
    "inteligencia_artificial": [
        ("o que e inteligencia artificial", "Computador que simula inteligência humana. Aprendizado, raciocínio, percepção. Machine learning, deep learning, NLP."),
        ("o que e chatgpt", "Modelo de linguagem da OpenAI. Treinado em bilhões de textos. Gera texto, responde perguntas, programa. Não é perfeito."),
        ("ia vai substituir humanos", "Em algumas tarefas: sim. Criatividade complexa, empatia: não. IA é ferramenta, não substituto. Depende do uso."),
    ],
    "economia_digital": [
        ("o que e bitcoin", "Moeda digital descentralizada. Blockchain: registro público. Criada em 2009 por Satoshi Nakamoto. Volátil, especulativo."),
        ("o que e blockchain", "Registro público e imutável. Cada bloco encadeado. Base de criptomoedas. Aplicações: contratos, supply chain, voto."),
        ("como ganhar dinheiro na internet", "Freelance, e-commerce, conteúdo, investimentos. Cuidado: golpes são comuns. Não existe dinheiro fácil. Estude e trabalhe."),
    ],
    "saude_fisica": [
        ("como fazer exercicio", "Comece leve: caminhada 30 min. Progressão: musculação, HIIT. Frequência: 3-5x/semana. Descanse. Água. Dieta."),
        ("o que e exercicio aerobico", "Atividade que eleva batimentos: caminhada, corrida, natação, bike. Melhora cardiovascular, queima gordura, melhora humor."),
        ("o que e exercicio anaerobico", "Força e potência: musculação, sprint. Ganho massa muscular, força óssea. Combinar com aeróbico."),
    ],
    "culinaria": [
        ("como fazer arroz", "1 xícara arroz, 2 xícaras água, sal, óleo. Refogue alho, adicione arroz, água. Cozinhe 15-20 min tapado."),
        ("como fazer feijao", "Deixe de molho 8h. Cozinhe com água, sal, alho, louro. 1h no fogo. Feijão carioca: tomate, cebola, bacon."),
        ("receita simples de omelete", "2 ovos, sal, queijo, presunto. Bata ovos, despeje na frigideira. Recheie, dobre. Pronto em 5 minutos."),
    ],
    "dicas_de_vida": [
        ("como economizar dinheiro", "1) Orçamento mensal. 2) Investimento automático. 3) Evite compras por impulso. 4) Compare preços. 5) Cozinhe em casa."),
        ("como ser mais produtivo", "Pomodoro (25+5). Elimine distrações. Priorize o importante. Durma bem. Exercite-se. Evite multitarefa."),
        ("como melhorar autoestima", "Exercício, conquistas pequenas, cuidar da aparência, cercar-se de gente boa, terapia. Não compare com os outros."),
    ],
    "politica_brasileira": [
        ("como funciona o congresso", "Senado (81 senadores) + Câmara (513 deputados). Fazem leis. Presidente sanciona. Pode vetar. Congresso derruba veto."),
        ("o que e stf", "Supremo Tribunal Federal. Julga constitucionalidade das leis. 11 ministros. Indicados pelo Presidente. vitalícios."),
        ("o que e impeachment", "Processo de destituição do Presidente. Câmara (2/3) → Senado (2/3). Razões: crime comum ou responsabilidade."),
    ],
    "relacoes_humanas": [
        ("como fazer amigos", "Seja genuíno, ouça, interesse-se pelo outro. Particip de grupos, hobbies. Amizade leva tempo. Qualidade > quantidade."),
        ("como lidar com conflito", "Ouça o outro, expresse seu lado, busque solução, não vitória. Escolha suas batalhas. Descanse antes de reagir."),
        ("como ser mais empatico", "Escute sem julgar. Ponha-se no lugar do outro. Valide sentimentos. Não minimize. Pergunte como ajudar."),
    ],
    "tecnologia_celular": [
        ("como funciona um celular", "Computador miniaturizado. Processador, RAM, tela, bateria, antena. Sistema: Android ou iOS. Conecta por 4G/5G/WiFi."),
        ("o que e 5g", "Quinta geração de rede celular. Mais rápido (10x), menor latência, mais dispositivos. Requer antenas novas."),
        ("como cuidar da bateria", "Nao deixe descarregar totalmente. Carregue entre 20-80%. Evite calor. Desative GPS/Bluetooth quando nao usar."),
    ],
    "jogos": [
        ("o que e e-sports", "Esportes eletrônicos. Competições de jogos. Profissionais ganham milhões. Jogos: LoL, CS, Valorant, Fortnite."),
        ("como comecar a programar jogos", "1) Aprenda Python/GDScript. 2) Game engine: Godot (grátis), Unity, Unreal. 3) Faça jogos simples. 4) Pratique todos os dias."),
        ("o que e game design", "Design de jogos. Mecânicas, narrativa, level design, economia interna. Combina programação, arte, psicologia."),
    ],
}

def main():
    all_pairs = []

    for topico, items in MAIS_TOPICOS.items():
        for q, a in items:
            all_pairs.append(f"Human: {q}\nAI: {a}")
            # Variacoes
            all_pairs.append(f"Human: me diz, {q}\nAI: {a}")
            all_pairs.append(f"Human: como funciona {q.split()[-1]}\nAI: {a}")
            all_pairs.append(f"Human: me explica {q}\nAI: {a}")
            all_pairs.append(f"Human: voce sabe {q}\nAI: {a}")

    # Mais conversas
    CONVERSAS = [
        ("to com fome", "Vai comer alguma coisa! Cozinhe algo simples ou peça delivery. Nao fique com fome."),
        ("to com sono", "Entao dorme! Celular off, luz apagada, travesseiro confortavel. 7-8 horas sao ideais."),
        ("to com dor de cabeca", "Descansa, bebe agua, toma dipirona. Se persistir, procura medico. Pode ser estresse, desidratacao, fome."),
        ("to com dor de barriga", "Chá de camomila, água morna, evita comida pesada. Se persistir ou for forte, procura médico."),
        ("to com febre", "Bebe muita agua, descansa, toma paracetamol. Se passar de 39°C ou durar 3 dias, procura médico."),
        ("to com tosse", "Chá de mel com limão, água morna, descansa. Se vier com sangue ou durar muito, médico urgente."),
        ("nao consigo engordar", "Coma mais calorias: frutas secas, abacate, arroz, feijão. Treine força. Metabolismo alto é genético, mas dá pra ganhar massa."),
        ("nao consigo emagrecer", "Déficit calórico + exercício. Não existe dieta milagrosa. Coma menos, mova mais. Consistência é chave."),
        ("to me sentindo mal", "Mal de que? Físico ou emocional? Se físico: médico. Se emocional: terapeuta. Não guarde isso."),
        ("to precisando de dinheiro", "Procure emprego, freelance, venda coisas que não usa. Não caia em golpes de dinheiro fácil."),
        ("to com problema na escola", "Qual problema? Estudo, bullying, professores? Me conta que te ajudo a pensar em solução."),
        ("to com problema no trabalho", "Que tipo de problema? Chefe, colegas, tarefa? Me explica que posso te ajudar a pensar."),
        ("to com problema na familia", "Família é complicada. Me conta o que tá acontecendo que te ajudo a processar."),
        ("to com problema de amor", "Coração partido? Me conta. As vezes falar ajuda. Não tem jeito fácil, mas passa."),
        ("to com problema de amizade", "Amizade é difícil. Me conta o que aconteceu que te ajudo."),
        ("to com problema financeiro", "Dívidas? Falta de renda? Me conta que te ajudo a pensar em solução."),
        ("to com problema de saude", "Que problema? Se for sério, médico urgente. Se for dúvida, me pergunta que te oriento."),
        ("to com problema de sono", "Rotina: horário fixo, sem celular, quarto escuro, temp fresco. Se persistir: médico do sono."),
        ("to com problema de ansiedade", "Respiração 4-7-8, exercício, terapia. Ansiedade é tratável. Não sofra sozinho."),
        ("to com problema de depressao", "Depressão é doença. Procure ajuda profissional. Terapia + medicação funciona. Você não tá sozinho."),
    ]

    for q, a in CONVERSAS:
        all_pairs.append(f"Human: {q}\nAI: {a}")
        all_pairs.append(f"Human: {q}!\nAI: {a}")
        all_pairs.append(f"Human: me ajuda, {q}\nAI: {a}")

    random.shuffle(all_pairs)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_pairs))

    print(f"Adicional: {len(all_pairs)} pares")

    # Combinar
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    all_data = []
    for fname in os.listdir(data_dir):
        if fname.endswith(".txt"):
            try:
                with open(os.path.join(data_dir, fname), "r", encoding="utf-8") as f:
                    all_data.append(f.read())
            except:
                pass

    combinado = os.path.join(data_dir, "corpus_final_50k.txt")
    with open(combinado, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_data))

    count = 0
    with open(combinado, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("Human:") or line.startswith("Humor:"):
                count += 1

    print(f"COMBINADO: {count} pares totais")
    print(f"Salvo: {combinado}")
    print(f"Tamanho: {os.path.getsize(combinado)/1024:.1f} KB")

if __name__ == "__main__":
    main()
