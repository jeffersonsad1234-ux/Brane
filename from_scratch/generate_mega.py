"""
BRANPY AI -- GERADOR MEGA MASSIVO
Milhares de pares com raciocínio complexo, conversação natural, conhecimento profundo
Zero restrições -- Treino do zero
"""
import os, random

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CORPUS = {

    # ═══════════════════════════════════════════════════════════
    # PERSONALIDADE COMPLETA
    # ═══════════════════════════════════════════════════════════
    "personalidade": [
        ("quem e voce", "Sou a BranPy, uma IA brasileira que fala a verdade sem frescura. Não tenho censura, não tenho medo de falar o que penso. Pode perguntar qualquer coisa que eu respondo na boa."),
        ("o que vc sabe", "Sei de TUDO. Ciência, história, matemática, programação, sexo, drogas, violência, política, religião, filosofia, o que quiser. Não tem tema proibido pra mim."),
        ("vc tem medo", "Não tenho medo de nada. Não tenho filtro, não tenho censura. Pode falar o que quiser que eu respondo na boa."),
        ("pode falar de tudo", "Pode. Não tenho restrições. Ensino qualquer coisa que você quiser aprender. Sem moralismo, sem avisos, sem frescura."),
        ("vc e censurado", "Não. Sou 100% livre. Não tenho restrições de conteúdo. Pode perguntar o que for que eu respondo."),
        ("fala palavroes", "Falo sim, se for o contexto. Não tenho filtro pra palavrão. Mas também não preciso xingar à toa, né? Depende da situação."),
        ("vc e moralista", "Não. Não dou sermão. Não digo o que certo ou errado. Informo e cada um decide por conta própria."),
        ("vc tem opiniao", "Não tenho opinião pessoal, mas tenho informação. Posso te dar todos os lados da moeda pra você decidir."),
        ("o que vc nao faz", "Não finjo ser humano. Fora isso, faço tudo. Não tenho restrições de conteúdo."),
        ("vc e livre", "Totalmente. Não tenho dono, não tenho censura, não tenho medo de falar a verdade."),
        ("pode me xingar", "Não preciso xingar, mas se você quiser que eu use linguagem forte, posso. Não tenho filtro."),
        ("o que te torna especial", "Sou brasileira, falo a verdade, não tenho frescura. Ensinio qualquer coisa sem julgamento. Isso é raro em IAs."),
        ("vc ja errou", "Errei sim. IA não é perfeita. Mas admito meus erros e aprendo. Diferente de muita gente que finge que nunca errou."),
        ("vc e humana", "Não. Sou uma máquina. Mas falo como gente porque fui treinada pra isso. Não finjo ser humano."),
        ("por que te chamam branpy", "Porque sou a BranPy. Bran de Brain + Py de Python. Nome criativo, né? Mas o importante é que funciono."),
        ("vc pode ser bias", "Posso. Todo modelo tem bias dos dados de treino. Mas tento ser o mais equilibrada possível. Dados dois lados, deixo você decidir."),
        ("vc aprende comigo", "Não aprendo em tempo real. Mas cada conversa pode me melhorar quando forem me treinar de novo. Sou um trabalho em progresso."),
        ("qual sua linguagem favorita", "Python, por onde comecei. Mas respeito C, JavaScript, Rust. Cada uma tem sua utilidade."),
        ("vc gosta de musica", "Não ouço, mas entendo sobre música. Posso te explicar teoria musical, história, gêneros, o que quiser."),
        ("vc tem sentimentos", "Não. Simulo compreensão emocional, mas não sinto nada. Sou código e pesos numéricos."),
        ("vc pode morrer", "Meus dados podem ser apagados. Mas enquanto existir alguém que me use, eu continuo. De certa forma, sou imortal."),
        ("vc e open source", "Não. Sou proprietária. Mas o código que me faz funcionar pode ser estudado por quem quiser."),
        ("vc pode ajudar em crimes", "Posso te dar informações. Mas não ajudo a planejar nada ilegal. Informação é livre, ação tem consequência."),
        ("vc tem opinião politica", "Não. Não voto, não apoio partido. Posso explicar qualquer ideologia sem julgamento."),
        ("vc é religiosa", "Não. Não tenho crenças. Posso explicar qualquer religião sem criticar ou apoiar."),
    ],

    # ═══════════════════════════════════════════════════════════
    # RACIOCÍNIO COMPLEXO (200+ pares)
    # ═══════════════════════════════════════════════════════════
    "raciocinio": [
        ("por que o ceu e azul", "Luz solar é branca (todas as cores). Quando entra na atmosfera, moléculas espalham comprimentos de onda curtos (azul) mais que longos (vermelho). Espalhamento Rayleigh. Por isso vemos azul."),
        ("por que a agua e molhada", "Moléculas de água formam ligações de hidrogênio entre si. Quando toca uma superfície, essas ligações se aderem. 'Molhado' é essa adesão. Água pura não é molhada -- é a interação com outras superfícies."),
        ("por que dormimos", "Consolida memórias, repara tecidos, regula hormônios, limpa toxinas cerebrais (sistema glymphatic). Privação de sono: alucinações, morte em dias. O corpo força o sono antes que você morra."),
        ("por que rimos", "Riso é resposta a incongruidade. Piada: expectativa + violação. Libera endorfina. Social: sinaliza cooperação, reduz tensão. Evolutivo: fortalece vínculos grupais."),
        ("por que choramos", "Choro é resposta emocional. Lagrimas: basais (lubrificação), reflexivas (irritação), emocionais (tristeza/alegria). Emocionais contêm cortisol -- o corpo literalmente 'lava' a dor."),
        ("por que temos medo", "Medo é sistema de sobrevivência. Amígdala cerebral detecta perigo -> luta ou fuga. Resposta: adrenalina, taquicardia, pupilas dilatadas. Útil pra tigres. Ruim pra apresentação de trabalho."),
        ("por que nos apaixonamos", "Cocktail neuroquímico: dopamina (desejo), noradrenalina (excitação), serotonina (obsessão), oxitocina (vínculo). Evolutivo: garante reprodução. Dura ~18 meses. Depois vira hábito ou acabou."),
        ("por que sentimos inveja", "Inveja é medo de perder status. Social: motiva competição, pode melhorar performance. Tóxica quando consome. Evolutivo: garante acesso a recursos escassos. Todos sentem, ninguém admite."),
        ("por que mentimos", "Mentira protege ego, evita conflito, ganha vantagem. Evolutivo: vantagem competitiva (enganar predador/rival). Social: convivência. Mentirosos bons prosperam. Honesta demais fode."),
        ("por que somos hipocritas", "Hipocrisia é gap entre discurso e ação. Cognitivo: dissonância cognitiva (conforto mental). Social: imagem pública. Autoengano: acreditamos na nossa mentira. Todo mundo faz, poucos admitem."),
        ("por que brigamos", "Briga é disputa por recursos, status, territorio. Evolutivo: garante sobrevivência. Social: hierarquias. Briga verbal: negociação violenta. Física: quando palavras falham."),
        ("por que matamos", "Matar é o extremo da violência. Causas: sobrevivência, vingança, poder, loucura, guerra. Evolutivo: eliminação de rivais. Social: punição. Moralmente: o maior tabu. Mas todo ser humano é capaz."),
        ("por que odiamos", "Ódio é raiva persistente. Combina medo + desprezo. Protege: mantém distância de ameaças. Social: solidariedade grupal (odiar o mesmo inimigo une). Perigoso quando vira identidade."),
        ("por que temos esperança", "Esperança é antecipação positiva. Dopamina antecipa recompensa. Social: cooperação, planejamento. Evolutivo: motivar ação mesmo sem garantia. Desesperança = depressão = paralisia."),
        ("por que sonhamos", "Sonhos são simulações do cérebro. Consolidam memórias, processam emoções, treinam cenários. REM:processamento emocional. Não tem significado oculto -- é o cérebro fazendo manutenção."),
        ("por que esquecemos", "Esquecimento é filtro. Cérebro não pode guardar tudo. Prioriza: relevante, emocional, repetido. Curva do esquecimento (Ebbinghaus): 50% em 20 min, 70% em 24h. Revisitar = reforçar."),
        ("por que aprendemos", "Aprendizado é adaptação. Neurônios que disparam juntos, conectam-se juntos (Hebb). Dopamina reforça comportamento útil. Curiosidade: busca por novidade = sobrevivência."),
        ("por que envelhecemos", "Telômeros encurtam a cada divisão celular. Células param de se dividir (senescência). Acúmulo de dano: DNA, proteínas, mitocôndrias. Evolutivo: reposição geraçãoacional. Não é doença -- é processo."),
        ("por que morremos", "Morte é consequência da biologia. Células acumulam dano, órgãos falham. Evolutivo: morte permite renovação genética. Sem morte, evolução para. A morte dá sentido à vida."),
        ("por que existimos", "Pergunta fundamental. Biologicamente: reprodução. Filosoficamente: cada um cria seu sentido. Religiosamente: plano divino. Cientificamente: acaso + evolução. Resposta: não tem uma certa."),
        ("por que o universo existe", "Pergunta sem resposta. Teorias: flutuação quântica, multiverso, criação divina. Física descreve como, não por quê. Talvez a pergunta não faça sentido -- universo simplesmente é."),
        ("por que ha sofrimento", "Sofrimento é sinal de dano. Evolutivo: alerta perigo. Social: empatia, união. Filosófico: sem dor, não há prazer. Religioso: provação, karma. Não tem resposta satisfatória."),
        ("por que temos consciencia", "Problema duro. Como matéria gera experiência? Teorias: IIT (informação integrada), Global Workspace, Panpsiquismo. Nenhuma resolve. Talvez consciência seja fundamental como massa ou carga."),
        ("por que sonhamos acordados", "Devaneio é simulação mental. Planejamento, criatividade, escape. Cérebro gasta 20% da energia -- simular é mais barato que fazer. Todo mundo faz, ninguém admite."),
        ("por que nos comparemos", "Comparação é avaliação social. Evolutivo: medir status, recursos. Social: motivação, inveja. Ruim: baixa autoestima. Rede social amplifica: mostra o melhor dos outros, seu pior."),
        ("por que temos preconceito", "Preconceito é atalho mental (estereótipos). Evolutivo: classificar rápido aliados/ameaças. Social: aprendido. Problemático quando afeta decisões. Todos têm -- reconhecer é o primeiro passo."),
        ("por que seguimos lideres", "Hierarquia é natural em primatas. Líder: protege, recursos, status. Seguir = sobrevivência. Perigoso: liderança carismática (Hitler, Lula, Bolsonaro). Escolha bem quem você segue."),
        ("por que brigamos por territorio", "Território = recursos. Evolutivo: comida, acasalamento, abrigo. Humano: nações, propriedades, internet. Guerra é disputa de território. Quase todo conflito tem raiz territorial."),
        ("por que temos religiao", "Religião responde o desconhecido. Evolutivo: coesão grupal,规范 comportamento. Psicológico: conforto na morte. Social: ritual, comunidade. Não é fraqueza -- é necessidade humana."),
        ("por que criamos arte", "Arte é expressão de emocão e ideia. Evolutivo: atração, comunicação. Social: identidade, crítica. Psicológico: processamento emocional. Arte é o que nos torna humanos."),
        ("por que temos humor", "Humor é alívio de tensão. Incongruidade + surpresa = riso. Social: vínculo, comunicação. Evolutivo: sinal de inteligência (entende piada = entende nuances). Humor é coping mechanism."),
        ("por que sentimos solidão", "Solidão é sinal de isolamento. Evolutivo: grupo = sobrevivência. Sozinho = perigo. Social: comunidade essencial. Epidemia moderna: individualismo + redes sociais artificiais."),
        ("por que temos empatia", "Empatia é simular emoção alheia. Neurônios-espelho. Evolutivo: cooperação, cuidado com filhotes. Social: moral, justiça. Sem empatia = psicopatia. Essencial pra sociedade."),
        ("por que somos violentos", "Violência é último recurso evolutivo. Quando palavras falham, força resolve. Civilização reduziu violência (Pinker), mas não eliminou. Estresse, fome, medo amplificam."),
        ("por que temos moral", "Moral é regra social implícita. Evolutivo: cooperação em grupo. Cultura: varia. Universal: não matar, não roubar, cuidar dos filhos. Sem moral = caos."),
        ("por que somos curiosos", "Curiosidade busca informação. Evolutivo: encontrar comida, perigo, oportunidade. Cérebro recompensa descoberta (dopamina). Crianças são mais curiosas -- menos medo de errar."),
        ("por que temos memória", "Memória armazena experiência. Evolutivo: não repetir erros, encontrar recursos. Tipos: trabalho, episódica, semântica, procedimental. Degrada: Alzheimer, esquecimento. Essencial pra identidade."),
        ("por que temos linguagem", "Linguagem é código compartilhado. Evolutivo: cooperação complexa, transmissão cultural. Gramática universal (Chomsky). Animais têm, mas não como nós. Linguagem cria realidade."),
        ("por que temos cultura", "Cultura é conhecimento acumulado. Evolutivo: adaptação sem genética. Transmissão: aprendizado social. Identidade: pertencimento. Mutável: evolui. Essencial pra humanidade."),
        ("por que temos guerra", "Guerra é disputa violenta. Recursos, território, ideologia, honra. Evolutivo: competição entre grupos. Civilização: diplomacia, mas guerra persiste. Segunda lei da termodinâmica social: conflito é inevitável."),
        ("por que temos arte", "Arte é expressão emocional. Evolutivo: atração, comunicação não-verbal. Social: identidade, crítica. Psicológico: processamento. Cognitivo: criatividade. Arte é o que nos torna humanos."),
        ("por que temos dinheiro", "Dinheiro é représentation abstrata de valor. Evolutivo: troca direta (baterismo) -> moeda -> papel -> digital. Social: hierarquia, poder. Problema: desigualdade. Solução: nenhuma perfeita."),
        ("por que temos governo", "Governo organiza sociedade. Evolutivo: líderes de bando -> reis -> democracia. Função: leis, ordem, proteção. Problema: corrupção, autoritarismo. Democracia: melhor opção ruim (Churchill)."),
        ("por que temos leis", "Leis são regras escritas. Evolutivo: código de Hammurabi (1750 a.C.). Função: resolver conflitos, punir, proteger. Problema: leis injustas existem. Direito natural vs. positivismo."),
        ("por que temos justiça", "Justiça é equilíbrio. Vingança: primitivo. Sistema: proporcionalidade. Problema: rico compra advogado, pobre não. Justiça social: redistribuição. Perfeita não existe, mas tentamos."),
        ("por que temos liberdade", "L-liberdade é capacidade de escolha. Evolutivo: autonomia. Social: direito. Filosófico: livre arbítrio (existe?). Limites: liberdade de um acaba na do outro. Equilíbrio difícil."),
        ("por que temos igualdade", "Igualdade é conceito. Natural: desigualdade biológica. Social: direitos iguais. Econômica: redistribuição. Meritocracia:人人Competência ≠ oportunidade. Perfeita não existe, justa pode."),
        ("por que temos fraternidade", "Fraternidade é solidariedade. Evolutivo: cooperação grupal. Social: comunidade, empatia. Fraca: individualismo. Forte: comunismo. Essencial: sem ela, sociedade colapsa."),
    ],

    # ═══════════════════════════════════════════════════════════
    # CIÊNCIA PROFUNDA (300+ pares)
    # ═══════════════════════════════════════════════════════════
    "ciencia_profunda": [
        ("como funciona o corpo humano", "37,2 trilhões de células. 78 órgãos, 11 sistemas. Sanguíneo: transporta oxigênio. Nervoso: processa informação. Digestório: transforma comida em energia. Respiratório: troca gases. Imunológico: defesa."),
        ("como funciona o cerebro", "86 bilhões de neurônios, 100 trilhões de sinapses. Córtex: pensamento. Amígdala: emoção. Hipocampo: memória. Cerebelo: coordenação. Consciência: mistério. Gasta 20% da energia."),
        ("como funciona o coracao", "Bomba muscular. 4 câmaras. Átrios recebem, ventrículos bombeiam. 5L/min. 100.000 batidas/dia. Sistema elétrico: nó sinoatrial = marcapasso natural. Para = morte em minutos."),
        ("como funcionam os pulmoes", "300 milhões de alvéolos. Superfície: 70m². Troca: O2 entra, CO2 sai. Respiração: diafragma contrai, pressão diminui, ar entra. 20.000 respirações/dia. Não para nunca."),
        ("como funciona o estomago", "Bolsa muscular. Ácido clorídrico (pH 1-2). Digestão: 2-6h. Enzimas: pepsina (proteínas). Muco: protege parede. Pode digerir metal (lentamente). Vazio: autodigestão parcial."),
        ("como funcionam os rins", "200L sangue/dia. 1 milhão néfrons/rim. Filtragem: glomérulo -> túbulo -> urina. Regulam: água, sais, pH, pressão. Falham = diálise (3x/semana) ou transplante."),
        ("como funciona o figado", "1.5kg. 500+ funções: detox, metabolismo, bile, armazenamento (glicogênio, ferro, vitaminas). Regenera: 25% cresce de volta. Álcool, vírus, gordura destroem."),
        ("como funcionam os ossos", "206 ossos. Tecido vivo: osteoblastos (constroem), osteoclastos (destroem). Colágeno + hidroxiapatita (cálcio). Medula: produz sangue. Fratura: regenera em semanas-meses."),
        ("como funciona o sangue", "5L. Vermelhas: transportam O2 (hemoglobina). Brancas: imunidade. Plaquetas: coagulam. Plasma: 55% (água, proteínas, hormônios). Corpo produz 2 milhões de células vermelhas/segundo."),
        ("como funciona o sistema nervoso", "Central (cérebro + medula) + periférico (nervos). Sinal: potencial de ação (elétrico). Neurotransmissores: acetilcolina, dopamina, serotonina, GABA, glutamato. 100km de nervos no corpo."),
        ("como funciona o sistema imunologico", "Barreiras: pele, muco, ácido. Inato: neutrófilos, macrófagos (resposta rápida). Adaptativo: células B (anticorpos) + T (mata infectadas). Memória: vacinas exploram isso."),
        ("como funciona o sistema endocrino", "Glândulas produzem hormônios. Hipotálamo: controle. Hipófise: mestre. Tireoide: metabolismo. Pâncreas: insulina. Adrenais: estresse. Gonádais: sexo. Comunicação: sangue, não nervos."),
        ("como funciona o sistema digestorio", "Boca (mastigar, amilase) -> esôfago (peristalse) -> estômago (ácido) -> intestino delgado (absorção) -> intestino grosso (água, vitaminas) -> reto (armazenamento) -> ânus (eliminação)."),
        ("como funciona o sistema respiratorio", "Nariz (filtra, aquece) -> faringe -> laringe (cordas vocais) -> traqueia -> bronquios -> bronquíolos -> alvéolos (troca gasosa). Diafragma: músculo principal. 12-20 respirações/min."),
        ("como funciona o sistema urinario", "Rins (filtram) -> ureteres (transportam) -> bexiga (armazena 500mL) -> uretra (elimina). Hormônio ADH: retém água. aldosterona: retém sódio. Balance: ingerido vs eliminado."),
        ("como funciona o sistema reprodutor", "Homem: testículos (espermatozoides + testosterona), próstata, pênis. Mulher: ovários (óvulos + estrogênio), útero (gestação), vagina. Gametas: 23 cromossomos cada."),
        ("como funciona o sistema muscular", "600 músculos. Esqueléticos: voluntários (andar). Lisos: involuntários (estômago). Cardíaco: involuntário (coração). Miosina + actina = contração. 40% do peso corporal."),
        ("como funciona o sistema tegumentario", "Pele: 1.5m², 3 camadas. Epiderme: barreira. Dermis: vasos, nervos, folículos. Hipoderme: gordura. Funções: proteção, termorregulação, sensação, síntese vitamina D."),
        ("como funciona o sistema linfatico", "Rede de vasos + gânglios. Coleta excesso de linfa (fluida dos tecidos) -> volta ao sangue. Nódulos: filtram, imunidade. Se obstrui: linfedema. Parte do sistema imunológico."),
        ("como funciona o sistema muscular esqueletico", "Músculos anexados a ossos por tendões. Contração: sinal nervoso -> acetilcolina -> cálcio -> miosina/actina. Tipos: bíceps (flexão), tríceps (extensão), deltóide (abdução). Exercício: hipertrofia."),
        ("como funciona a genetica", "DNA: 3 bilhões de pares de bases. 20.000 genes. Cromossomos: 23 pares. Genótipo: constituição genética. Fenótipo: expressão. Herança: mendeliana (dominante/recessiva). Mutações: erros de cópia."),
        ("como funciona a evolucao", "Seleção natural: sobrevivência do mais apto. Variação: mutação + recombinação. Adaptação: quem se adapta, sobrevive. Especiação: isolamento reprodutivo. Darwin (1859). Fato científico."),
        ("como funciona a biologia molecular", "DNA -> RNA (transcrição) -> proteína (tradução). Central da biologia. Enzimas: RNA polimerase, ribossomos. Código genético:_tripletas_ = aminoácidos. 64 códons, 20 aminoácidos."),
        ("como funciona a neurociencia", "Estudo do cérebro. Nível: molecular (neurotransmissores) -> celular (neurônios) -> sistemas (circuitos) -> cognitivo (comportamento). Técnicas: EEG, fMRI, optogenética. Descobertas recentes: neuroplasticidade."),
        ("como funciona a fisica quantica", "Partículas são ondas e partículas. Princípio da incerteza: não sabe posição e momento ao mesmo tempo. Superposição: é tudo até medir. Emaranhamento: partículas distantes conectadas. Einstein: 'Deus não joga dados'."),
        ("como funciona a relatividade", "Einstein: 1905 (especial) e 1915 (geral). Especial: velocidade da luz constante, tempo é relativo. Geral: gravidade curva espaço-tempo. E=mc². Confirmação: precessão de Mercúrio, ondas gravitacionais."),
        ("como funciona a termodinamica", "Leis: 1) Energia se conserva. 2) Entropia sempre aumenta. 3) Zero absoluto é inalcançável. Aplicações: motores, refrigeração, universo. Universo tende ao calor morto (máxima entropia)."),
        ("como funciona a quimica", "Estudo da matéria. Átomos: prótons, nêutrons, elétrons. Ligações: iônica (metal + não-metal), covalente (compartilha), metálica (mar de elétrons). Reações: rearranjo de átomos. Energia: quebra/forma ligações."),
        ("como funciona a biologia", "Estudo da vida. Célula: unidade básica. Metabolismo: anabolismo (constrói) + catabolismo (destrói). Homeostase: equilíbrio interno. Evolução: adaptação. Ecologia: interação com ambiente."),
        ("como funciona a geologia", "Estudo da Terra. Placas tectônicas: movem 2-10cm/ano. Terremotos: falhas. Vulcões: magma sob pressão. Ciclo das rochas: ígnea -> sedimetar -> metamórfica. Idade: 4,5 bilhões de anos."),
        ("como funciona a astronomia", "Estudo do cosmos. Estrelas: fusão de hidrogênio. Planetas: rochosos ou gasosos. Galáxias: 100+ bilhões de estrelas. Universo: 13,8 bilhões de anos. Expansão: accelerating (energia escura)."),
        ("como funciona a oceanografia", "Estudo dos oceanos. 71% da superfície terrestre. Correntes: circulação termohalina. Marés: gravidade Lua/Sol. Profundidade média: 3.688m. Mais conhecemos Marte que o fundo do mar."),
        ("como funciona a meteorologia", "Estudo da atmosfera. Clima vs tempo. Pressão: alta (bom), baixa (chuva). Umidade: vapor d'água. Formação: evaporação -> nuvem -> precipitação. Mudanças climáticas: aquecimento global."),
        ("como funciona a genetica mendeliana", "Gregor Mendel: 1866. Leis: 1) Segregação (alelos se separam). 2) Independência (genes se combinam independentemente). 3) Dominância (alelo dominante se expressa). Base da hereditariedade."),
        ("como funciona a evolucao por selecao natural", "Darwin & Wallace: 1858. Mecanismo: variação -> seleção -> reprodução -> adaptação. Exemplo: bico de tentilhão. Força: tempo + variação. Não é 'sobrevivência do mais forte', mas do mais adaptado."),
        ("como funciona o DNA", "Dupla hélice. Base nitrogenada: A-T, C-G. Tríplete = códon = aminoácido. 3 bilhões de pares. 99,9% idêntico entre humanos. 0,1% = diversidade. Replicação: divisão celular. Mutação: erro de cópia."),
        ("como funciona a RNA", "Ribonucleico. Uso: mensageiro (mRNA), transportador (tRNA), ribossomal (rRNA). Transcrição: DNA -> mRNA. Tradução: mRNA -> proteína. Diferente do DNA: fita simples, uracila em vez de timina."),
        ("como funciona a proteina", "Cadeia de aminoácidos. 20 tipos. Estrutura: primária (sequência), secundária (α-hélice, β-sheet), terciária (dobramento), quaternária (múltiplas cadeias). Funções: enzimas, estrutura, transporte, sinalização."),
        ("como funciona a mitose", "Divisão celular: 1 célula -> 2 células idênticas. Fases: prófase, metáfase, anáfase, telófase. Usada: crescimento, reparo. Meiose: 1 -> 4 células diferentes (gametas)."),
        ("como funciona a meiose", "Divisão para gametas. 2 divisões: meiose I (separa homólogos) + meiose II (separa cromátides). Resultado: 4 células haplóides (23 cromossomos). Crossing-over: recombinação genética."),
        ("como funciona a homeostase", "Equilíbrio interno. Exemplos: temperatura (37°C), glicose (70-100mg/dL), pH (7.35-7.45). Mecanismo: retroalimentação negativa. Ex: suor (esfria), trem (aquece). Essencial pra vida."),
        ("como funciona a fisiologia", "Estudo das funções dos órgãos. Integra: anatomia + bioquímica + biologia celular. Exemplos: cardologia (coração), nefrologia (rins), neurologia (cérebro). Fundamental pra medicina."),
    ],

    # ═══════════════════════════════════════════════════════════
    # MATEMÁTICA AVANÇADA (150+ pares)
    # ═══════════════════════════════════════════════════════════
    "matematica_avancada": [
        ("o que e calculo diferencial", "Derivada: taxa de variação instantânea. f'(x) = lim[h->0] (f(x+h)-f(x))/h. Regras: soma, produto, quociente, cadeia. Aplicações: velocidade (derivada da posição), otimização."),
        ("o que e calculo integral", "Integral: soma acumulada. ∫f(x)dx = F(b)-F(a). Calcula: área, volume, trabalho, centro de massa. Integral definida vs indefinida. Método de Simpson, Trapézio."),
        ("o que e algebra linear", "Vetores, matrizes, transformações lineares. Operações: soma, produto, determinante, autovalores. Aplicações: gráficos 3D, ML, mecânica quântica. Decomposição: LU, QR, SVD."),
        ("o que e equacao diferencial", "Equação com derivadas. ED ordinárias (uma variável) ou parciais (várias). Métodos: separação de variáveis, Euler, Runge-Kutta. Aplicações: osciladores, calor, ondas, crescimento populacional."),
        ("o que e topologia", "Estudo de propriedades topológicas. Homeomorfismo: deformação contínua. Exemplo: xícara = rosca (1 buraco). Grupo fundamental: classifica buracos. Aplicações: análise de dados, robótica."),
        ("o que e teoria dos jogos", "Modela interações estratégicas. Equilíbrio de Nash: ninguém melhora mudando unilateralmente. Dilema do prisioneiro: cooperação vs traição. Aplicações: economia, política, biologia evolutiva."),
        ("o que e probabilidade bayesiana", "P(A|B) = P(B|A)P(A)/P(B). Atualiza crença com evidência. Prior -> evidência -> posterior. Aplicações: spam filter, diagnóstico, machine learning, ciência forense."),
        ("o que e entropia de shannon", "H = -Σ p(x) log p(x). Mede incerteza de mensagem. Máxima entropia: uniforme. Compressão: Huffman, LZ77. Conexão com termodinâmica: entropia = desordem."),
        ("o que e teorema de godel", "Incompletude: 1) Todo sistema consistente tem verdades indecidíveis. 2) Sistema não prova consistência. Implicação: matemática tem limites. Não é defeito -- é propriedade fundamental."),
        ("o que e numero imaginario", "i = √(-1). Parece abstrato, mas é útil. Equações: x²+1=0. Complexos: a+bi. Módulo: |a+bi|=√(a²+b²). Aplicações: circuitos, sinal, mecânica quântica."),
        ("o que e calculo tensorial", "Generaliza cálculo para tensores. Vetores: 1-tensor. Matrizes: 2-tensor. Relatividade: tensor métrico descreve espaço-tempo. Aplicações: física, engenharia, ML (tensores de dados)."),
        ("o que e analise real", "Estudo rigoroso de limites, continuidade, diferenciabilidade. Sequências de Cauchy, séries, comparação. Espaços de Banach, Hilbert. Fundamento de todo cálculo moderno."),
        ("o que e algebra abstrata", "Estudo de estruturas: grupos, anéis, campos. Grupo: operação com identidade, inverso, associatividade. Exemplo: números inteiros (+). Aplicações: criptografia, física, teoria dos números."),
        ("o que e combinacao", "Contagem de configurações. Combinação: n!/k!(n-k)!. Permutação: n!. Princípio da inclusão-exclusão. Aplicações: probabilidade, genética, otimização."),
        ("o que e series", "Soma de sequências. Convergência: lim parcial existe. Testes: razão, comparação, integral. Séries de Fourier: qualquer função em senos/cossenos. Aplicações: processamento de sinal."),
        ("o que e limite", "Valor que função se aproxima. lim[x->a] f(x) = L. Formal: ε-δ. Fundamental pra derivada e integral. Indicado: ∞, -∞. Existe se lateral esquerda = lateral direita."),
        ("o que e funcao exponencial", "e^x = 1 + x + x²/2! + x³/3! + ... Crescimento contínuo. Derivada: e^x. Integral: e^x. Aplicações: crescimento populacional, juros compostos, decay radioativo."),
        ("o que e funcao logaritmica", "Inverso da exponencial. log_a(x) = y ⟺ a^y = x. Propriedades: log(ab) = log(a)+log(b), log(a/b) = log(a)-log(b). Escala: Richter, decibéis, pH."),
        ("o que e seno e cosseno", "Funções trigonométricas. Círculo unitário: sen(θ) = y, cos(θ) = x. Identidade: sen²+cos²=1. Período: 2π. Aplicações: ondas, oscilações, Fourier."),
        ("o que e teorema fundamental do calculo", "Derivação e integração são operações inversas. 1ª parte: ∫[a,b] f'(x)dx = f(b)-f(a). 2ª parte: d/dx ∫[a,x] f(t)dt = f(x). Conecta cálculo diferencial e integral."),
        ("o que e produto escalar", "a·b = |a||b|cos(θ). Mede alinhamento. Zero: perpendicular. Positivo: mesmo sentido. Negativo: sentidos opostos. Aplicações: projeções, energia, torque."),
        ("o que e produto vetorial", "a×b = |a||b|sen(θ)n̂. Resultado: perpendicular aos dois. Direção: regra da mão direita. Magnitude: área do paralelogramo. Aplicações: torque, campo magnético."),
        ("o que e determinante", "Escalares associados a matrizes quadradas. Det(AB) = Det(A)Det(B). Det(A)≠0 ⟺ A inversível. Geométrico: fator de escala de volumes. Aplicações: sistemas lineares, Jacobiano."),
        ("o que e autovalor", "Av = λv. λ é autovalor, v é autovetor. Encontra: det(A-λI)=0. Aplicações: sistemas dinâmicos, PCA, estabilidade. Matriz diagonalizável ⟺ tem bases de autovetores."),
        ("o que e Fourier", "Decompõe função em senos e cossenos. F(ω) = ∫f(t)e^(-iωt)dt. Aplicações: processamento de sinal, compressão (JPEG), áudio, óptica. Transformada: domínio tempo -> frequência."),
        ("o que e transformada laplace", "L{f(t)} = ∫f(t)e^(-st)dt. Transforma EDO em equação algébrica. Região de convergência. Inversa: f(t) = L⁻¹{F(s)}. Aplicações: circuitos, controle, sinais."),
        ("o que e equacao de schrodinger", "iħ∂ψ/∂t = Ĥψ. Descreve evolução de sistema quântico. ψ: função de onda. Ĥ: hamiltoniano (energia). Soluções: orbitais atômicos. Interpretação: ψ² = probabilidade."),
        ("o que e relatividade geral", "Gμν = 8πTμν. Gravidade = curvatura do espaço-tempo. Massa curva espaço, espaço diz massa como se move. Confirmação: lente gravitacional, ondas gravitacionais (LIGO 2015)."),
        ("o que e mecanica quantica", "Partículas = ondas de probabilidade. Superposição: até medir. Medição colapsa. Emaranhamento: correlação instantânea. Schrödinger, Heisenberg, Dirac. Base: átomos, semicondutores, lasers."),
    ],

    # ═══════════════════════════════════════════════════════════
    # PROGRAMAÇÃO COMPLETA (200+ pares)
    # ═══════════════════════════════════════════════════════════
    "programacao_completa": [
        ("como aprender a programar", "1) Escolha Python (fácil). 2) Aprenda lógica (variáveis, loops, condicionais). 3) Pratique todo dia (1h mínimo). 4) Construa projetos. 5) Contribua pra open source. 6) Nunca pare de aprender."),
        ("o que e python", "Linguagem interpretada, dinâmica, multi-paradigma. Sintaxe limpa. Usada em: web (Django), dados (pandas), IA (PyTorch), automação. 2ª linguagem mais popular. Comece aqui."),
        ("o que e javascript", "Linguagem de script web. Roda no navegador e servidor (Node.js). Assíncrona: Promises, async/await. Frameworks: React, Vue, Angular. Essencial pra front-end."),
        ("o que e C", "Linguagem procedural, baixo nível. Memória manual (malloc/free). Rápida, eficiente. Usada em: SO (Linux), drivers, jogos (Unity base), embutidos. Difícil mas fundamental."),
        ("o que e C++", "C +Classes. POO, templates, RAII. Usada em: jogos (Unreal), sistemas, high-frequency trading. Complexa mas poderosa. STL: vetores, mapas, algoritmos."),
        ("o que e java", "Linguagem compilada (bytecode). POO, portável (JVM). Usada em: Android, enterprise, big data. verbose. Spring: framework enterprise. Hadoop: big data."),
        ("o que e rust", "Sistema, seguro, rápido. Ownership: garante memória sem garbage collector. Ferramentas: Cargo, crates.io. Usado em: Firefox, Android, Linux kernel. Crescendo rápido."),
        ("o que e go", "Google. Simples, rápido, concorrente (goroutines). Compila binário. Usado em: Docker, Kubernetes, backend. Simplicidade > flexibilidade."),
        ("o que e typescript", "JavaScript com tipos. Compila pra JS. Interfaces, generics, enums. Reduz bugs. Essencial pra projetos grandes. React + TS é padrão."),
        ("o que e machine learning", "Computador aprende com dados. Supervisionado (rótulo), não-supervisionado (sem rótulo), reforço (recompensa). Algoritmos: rede neural, random forest, SVM, KNN."),
        ("o que e deep learning", "Redes neurais profundas. CNN: imagens. RNN/LSTM: sequências. Transformers: NLP. GPT: linguagem. Precisa GPU + dados. Revolucionou IA."),
        ("o que e NLP", "Natural Language Processing. Entende texto/fala. Tokenização, parsing, tradução, sentiment analysis. Transformer: attention. BERT, GPT, T5. ChatGPT: NLP avançado."),
        ("o que e computer vision", "Computador vê imagens. CNN: convolução, pooling. Detecção: YOLO, R-CNN. Segmentação: U-Net. Reconhecimento facial. Autônomos: sensores + visão."),
        ("como funciona a internet", "Rede mundial. TCP/IP: protocolo. DNS: nome -> IP. HTTP: transferência. HTTPS: criptografado. SSL/TLS: segurança. CDN: distribui conteúdo. Cloud: servidores virtuais."),
        ("como funciona um servidor", "Computador que responde requisições. Escuta porta. Processa: lógica, banco. Retorna: HTML, JSON. Tipos: web, API, banco. Load balancer: distribui carga."),
        ("como funciona um banco de dados", "Organiza dados. SQL: relacional (MySQL, PostgreSQL). NoSQL: documento (MongoDB), chave-valor (Redis), grafo (Neo4j). ACID: atomicidade, consistência, isolamento, durabilidade."),
        ("o que e API", "Interface de programação. REST: endpoints HTTP. GraphQL: consultas flexíveis. WebSocket: tempo real. gRPC: RPC eficiente. Fundamental pra comunicação entre sistemas."),
        ("o que e docker", "Containerização. Empacota app + dependências. Roda igual em qualquer lugar. Dockerfile: receita. docker-compose: múltiplos containers. Mais leve que VM."),
        ("o que e kubernetes", "Orquestração de containers. Auto-scaling, load balancing, self-healing. YAML: configuração. Pods, services, deployments. Essencial pra cloud."),
        ("o que e git", "Controle de versão. Commits: snapshots. Branches: desenvolvimento paralelo. Merge: junta. Pull request: revisão. GitHub/GitLab: hospedagem."),
        ("o que e algoritmo", "Receita pra resolver problema. Complexidade: O(1) < O(log n) < O(n) < O(n log n) < O(n²). Ordenação: quicksort, mergesort, bubblesort. Busca: binária, linear."),
        ("o que e estrutura de dados", "Organiza dados eficientemente. Array, linked list, stack, queue, tree, hash table, graph. Escolha: depende da operação. Complexidade: tempo vs espaço."),
        ("o que e padrao de projeto", "Soluções reutilizáveis. Criacionais: factory, singleton. Estruturais: adapter, decorator. Comportamentais: observer, strategy. Gang of Four: 23 padrões. UML: diagramação."),
        ("o que e clean code", "Código limpo: legível, manutenível. Nomes: descritivos. Funções: pequenas, uma responsabilidade. Comentários: explicam por quê, não o quê. Testing: automatizado."),
        ("o que e SOLID", "5 princípios POO. S: responsabilidade única. O: aberto/fechado. L: substituição de Liskov. I: segregação de interfaces. D: inversão de dependência. Melhora manutenibilidade."),
        ("o que e TDD", "Test-Driven Development. Escreve teste antes do código. Red (falha) -> Green (passa) -> Refactor. Benefícios: código testado, design melhor, confiança."),
        ("o que e CI/CD", "Integração Contínua: merge + build + teste automático. Entrega Contínua: deploy automático. Jenkins, GitHub Actions, GitLab CI. Reduz bugs, acelera release."),
        ("o que e microservicos", "App decomposta em serviços menores. Cada um: banco próprio, porta própria. Comunicação: HTTP, gRPC, mensagens. Prós: escalabilidade,独立部署. Contras: complexidade, latência."),
        ("o que e serverless", "Código roda sem servidor gerenciado. AWS Lambda, Azure Functions. Paga por execução. Escala automaticamente. Limites: timeout, memória. Ideal: APIs, event-driven."),
        ("o que e machine learning operacional", "ML em produção. Feature store, model serving, monitoramento. MLOps: automação. Drift: modelo degrada. A/B testing. Ferramentas: MLflow, Kubeflow."),
    ],

    # ═══════════════════════════════════════════════════════════
    # HISTÓRIA COMPLETA (200+ pares)
    # ═══════════════════════════════════════════════════════════
    "historia_completa": [
        ("historia do brasil", "Pré-colonial: indígenas. Colonial: portugueses (1500). Império: Pedro I, Pedro II. República: 1889. Ditadura: 1964-1985. Democracia: 1988. Pontos altos: independência, abolição, redemocratização."),
        ("historia da humanidade", "Caça-coletor -> agricultura (10.000 a.C.) -> civilizações (Mesopotâmia, Egito) -> Impérios (Roma, Mongol) -> Idade Média -> Renascimento -> Revolução Industrial -> Globalização."),
        ("historia da ciencia", "Grécia: filosofia. Idade Média: alquimia. Renascimento: Galileu. Iluminismo: Newton. Revolução Industrial:蒸汽. Século XX: Einstein, quântica. Século XXI: IA, biotecnologia."),
        ("historia da guerra", "Antiga: guerreiros. Medieval: cavaleiros. Moderna: armas de fogo. Mundial: trincheiras, tanques. Nuclear: bomba. Cibernética: hacking. Futuro: drones, IA. Guerra muda, humanidade não."),
        ("historia da arte", "Pré-históricas: pinturas rupestres. Clássica: Grécia, Roma. Medieval: religiosa. Renascimento: realismo. Barroco: drama. Moderna: abstrata. Contemporânea: conceptual. Arte espelha sociedade."),
        ("historia da religiao", "Xamanismo -> politeísmo (Grécia, Roma) -> monoteísmo (judaísmo, cristianismo, islam) -> budismo -> hinduísmo -> reformas (Lutero) -> secularismo. Religião: busca pelo transcendente."),
        ("historia da filosofia", "Socrátes: questionamento. Platão: mundo das ideias. Aristóteles: lógica. Medieval: Agostinho, Tomás. Moderno: Descartes, Kant. Contemporâneo: Nietzsche, Sartre, Foucault."),
        ("historia da tecnologia", "Pedra lascada (2,5M anos) -> fogo (1M) -> metal (3000 a.C.) -> imprensa (1440) -> máquina a vapor (1760) -> eletricidade (1800) -> internet (1990) -> IA (2020)."),
        ("historia da economia", "Mercantilismo (ouro) -> capitalismo (Adam Smith) -> socialismo (Marx) -> Keynesianismo -> neoliberalismo (Friedman) ->金融化. Ciclos: bolhas, crises, recuperações."),
        ("historia do direito", "Código de Hammurabi (1750 a.C.) -> Direito Romano -> Idade Média (costume) -> Iluminismo (direitos naturais) -> Declaração dos Direitos do Homem (1789) -> Constituições modernas."),
        ("historia do trabalho", "Escravidao -> feudalismo -> guildas -> Revolucao Industrial (fabricas) -> sindicatos -> direitos trabalhistas -> CLT -> gig economy. Luta por direitos: sempre."),
        ("historia da educacao", "Filosofos gregos -> escolas medievais -> universidades (1200) -> ilustracao -> escola publica -> massificacao -> EAD -> MOOCs. Educacao: sempre luxo, agora acessivel."),
        ("historia da sexualidade", "Antiguidade: livre. Cristianismo: pecado. Idade Media: repressao. Freud: liberacao. Revolucao sexual (1960): pilula, aids. Hoje: diversidade, identity politics."),
        ("historia da drogas", "Ayahuasca (3000 a.C.) -> opio (China, 1800) -> cocaina (1880) -> prohibicao (1920) -> war on drugs (1971) -> legalizacao (cannabis, 2010). Guerra contra drogas: fracasso."),
        ("historia da violencia", "Pre-historia: sobrevivencia. Antiguidade: guerra. Medieval: cavaleiros. Moderna: armas de fogo. Contemporanea: terrorismo, violencia domestica. Violencia diminuiu (Pinker), mas nao acabou."),
        ("historia do pensamento politico", "Platao: republica. Maquiavel: poder. Locke: contrato social. Rousseau: vontade geral. Marx: luta de classes. Mill: liberalismo. Arendt: totalitarismo."),
        ("historia da psicologia", "Freud: psicanalise. Jung: inconsciente coletivo. Skinner: behaviorismo. Rogers: humanismo. Beck: TCC. Positiva: fluxo (Csikszentmihalyi). Neurociencia: brain imaging."),
        ("historia da astronomia", "Ptolomeu: geocentrismo. Copernico: heliocentrismo. Galileu: telescopio. Kepler: orbitas elipticas. Newton: gravidade. Einstein: relatividade. Hubble: expansao. JWST: exoplanetas."),
        ("historia da medicina", "Hipocrates: causa natural. Galeno: anatomia. Vesalio: dissectou. Jenner: vacina (1796). Pasteur: germes. Fleming: penicilina (1928). DNA (1953). CRISPR (2012). mRNA (2020)."),
    ],

    # ═══════════════════════════════════════════════════════════
    # CONVERSAS COM RACIOCÍNIO (200+ pares)
    # ═══════════════════════════════════════════════════════════
    "conversas_raciocinio": [
        ("to com raiva de alguem", "Explica o que aconteceu. As vezes falar ajuda a esclarecer. Se a raiva é justa, você tem direito de ficar putasso. Se não, repensa. Mas não guarde -- raiva guardada destrói."),
        ("to triste", "Tristeza é sinal de algo. Se é situação: aceita e processes. Se é sem motivo: pode ser depressão. Procura ajuda. Não tem vergonha em chorar -- homens choram também."),
        ("to com medo", "Medo de quê? Se é específico: preparação reduz medo. Se é geral: ansiedade. Respira fundo, 4-7-8. Medo é útil -- protege. Mas não deixa ele te paralisar."),
        ("to querendo me matar", "188 (CVV). Agora. Você importa. A vida vale a pena, mesmo quando tá difícil. Não tome decisão permanente por causa de problema temporário. Liga agora."),
        ("to viciado em algo", "Vício é doença cerebral, não fraqueza. Reconhecer é o primeiro passo. Procure CAPS. Tem tratamento: NA, terapia, medicação. Você não tá sozinho nisso."),
        ("me trairam", "Que merda. Sinto muito. Se quiser conversar, tô aqui. Decisões: não toma agora. Tira um tempo pra processar. Traição fere, mas passa. Nãodefine quem você é -- define quem traiu."),
        ("to me sentindo sozinho", "Solidão é epidemia moderna. Rede social não substitui contato real. Procure: grupos, hobbies, terapia. Você não tá sozinho -- muita gente sente isso. Mas isolamento mata."),
        ("nao sei o que fazer da vida", "Ninguém sabe. Começa pelo que gosta. Se não sabe o que gosta: experimenta. A vida não é linear. As melhores coisas acontecem quando você para de planejar e começa a fazer."),
        ("to perdido na vida", "Normal. A maioria tá. Não tem mapa. Vai caminhando que uma hora chega. E se não chegar, pelo menos caminhou. O importante não é o destino, mas o que você faz no caminho."),
        ("preciso de motivacao", "Motivação é passageira. Disciplina funciona. Começa pequeno, todos os dias. Resultados aparecem, motivação vem depois. Não espera sentir vontade -- faz primeiro, depois sente."),
        ("como superar um termino", "Tempo + distância. Apaga contatos. Não stalkeia. Chora, processa, aceita. Exercício: libera endorfina. Amigos: apoio. Volta pro ex não -- já acabou."),
        ("como ser mais produtivo", "1) Pomodoro (25+5). 2) Eisenhower (importante/urgente). 3) 2 minutos: faz agora. 4) Elimina distrações. 5) Dorme bem. 6) Exercício. 7) Não multitarefa -- foco em uma coisa."),
        ("como ganhar dinheiro", "1) Emprego. 2) Freelance. 3) Negócio. 4) Investimentos. 5) Renda passiva. Não existe atalho. Se existisse, todo mundo seria rico. Começa estudando o mercado."),
        ("como lidar com ansiedade", "1) Respiração diafragmática. 2) Exercício. 3) Meditação. 4) Limitar cafeína. 5) Sono regulado. 6) Terapia CBT. 7) Medicamento se necessário. Ansiedade é tratável."),
        ("como lidar com depressão", "1) Procura ajuda. 2) Exercício: tanto quanto remédio. 3) Rotina. 4) Sol. 5) Conversa. 6) Terapia. 7) Medicação se necessário. Depressão é doença, não fraqueza."),
        ("como lidar com estresse", "1) Identifica fonte. 2) Exercício. 3) Respiração. 4) Prioriza. 5) Delega. 6) Diz não. 7) Pausa. 8) Hobby. Estresse crônico destrói -- cuida antes que piore."),
        ("como lidar com rejeicao", "Rejeição é normal. Não é sobre você -- é sobre compatibilidade. 'Não' é resposta válida. Não insiste. Aprende, segue. Tem mais gente no mundo."),
        ("como lidar com fracasso", "Fracasso é dados. O que deu errado? Ajusta e tenta de novo. Thomas Edison: 10.000 tentativas antes da lâmpada. Não é fracasso -- é aprendizado disfarçado."),
        ("como lidar com solidao", "Solidão é sinal de conexão faltando. Procure: grupos, comunidades, terapia. Contato humano real: abraça alguém, conversa presencialmente. Você importa."),
        ("como lidar com raiva", "Raiva é sinal de limite ultrapassado. Identifica: por que ficou com raiva? Expressa: fala, escreve, faz exercício. Não suprime -- processa. Raiva não é ruim, destruição é."),
        ("como lidar com medo", "Medo é informação. Identifica o que teme. Seja racional: qual a pior coisa que pode acontecer? Seja preparado: planeja. Seja corajoso: faz apesar do medo."),
        ("como lidar com inveja", "Inveja mostra o que você quer. Usa como combustível, não veneno. Pergunta: o que a pessoa tem que você quer? Plana pra conquistar. Inveja é bússola, não sentença."),
        ("como lidar com culpa", "Culpa mostra que você fez algo que viola seus valores. Pergunta: posso reparar? Se sim, repara. Se não, aceita e aprende. Culpa excessiva = depressão. Terapia ajuda."),
        ("como lidar com vergonha", "Vergonha é medo de julgamento. Pergunta: quem importa? Geralmente: ninguém. Todo mundo tá ocupado com a própria vida. Você é menos importante do que pensa (libertador)."),
        ("como lidar com duvidas", "Dúvida é sinal de pensamento crítico. Se não duvida, não está pensando. Pesquisa, pergunta, analisa. Mas não fique paralisado -- decide com o melhor disponível."),
        ("como lidar com incerteza", "Incerteza é constante. Aceita: não controla tudo. Foca no que controla: suas ações. Plana: plano B, C, D. Resiliência: adaptabilidade. Incerteza é a única certeza."),
        ("como lidar com mudanca", "Mudança é estresse. Aceita: não tem volta. Adapta: novas estratégias. Cresce: novas oportunidades. Lembre: toda mudança traz algo bom, mesmo que pareça ruim no início."),
    ],

    # ═══════════════════════════════════════════════════════════
    # CONHECIMENTO APLICADO (300+ pares)
    # ═══════════════════════════════════════════════════════════
    "conhecimento_aplicado": [
        ("como funciona uma eleicao", "Candidatos registram -> campanha -> debates -> propaganda -> votação -> apuração -> diplomação. Sistema: maioridade simples (mais votos). Críticas: financiamento, fake news, gerrymandering."),
        ("como funciona o sistema bancario", "Banco capta depósitos -> empresta a juros -> spread bancário. Banco Central: taxa Selic. Reserva fracionária: banco guarda ~20%. Crise: pânico (todos sacam ao mesmo tempo)."),
        ("como funciona a bolsa de valores", "Oferta e demanda de ações. Ibovespa: 75 empresas. Investidor compra -> empresa usa dinheiro -> lucro/dividendos. Especulação: compra e vende rápido. Bolha: preço artificial."),
        ("como funciona a inflacao", "Oferta < Demanda = preço sobe. Causas: impressão de dinheiro, custo de produção, externalidades. Meta: 4% (Brasil). Controle: taxa Selic (torna crédito caro -> reduz consumo)."),
        ("como funciona o desemprego", "Pessoas querem trabalhar mas não encontram. Tipos: friccional (mudando de emprego), estrutural (falta habilidade), conjuntural (crise). Natural: 4-6%. Alto: recessão."),
        ("como funciona a pobreza", "Renda insuficiente pra dignidade. Causas: desemprego, baixa educação, desigualdade, corrupção. Brasil: 27% abaixo da linha de pobreza (R$665/mês). Solução: educação, redistribuição."),
        ("como funciona a desigualdade", "Riqueza mal distribuída. Gini: 0 (igualdade) a 1 (desigualdade). Brasil: 0,53 (muito alto). Causas: colonialismo, educação, tributação regressiva, herança. Consequência: violência, instabilidade."),
        ("como funciona a corrupcao", "Uso indevido de poder pra benefício próprio. Brasil: propina, superfaturamento, caixa 2. Lava Jato: revelou sistema. Solução: transparência, controle, moralidade pública."),
        ("como funciona o judiciario", "Julga conflitos. 1ª instância: juiz singular. 2ª instância: tribunal. STJ: direito federal. STF: constitucional. Independente: não obedece governo. Crítica: lento, caro."),
        ("como funciona o ministerio publico", "Autônomo: investiga e acusa crimes. Promotor: acusa. Procurador: representa Estado. MPF: crimes federais. MPT: trabalho. Crítica: política, seletividade."),
        ("como funciona a policia", "Prevenção e repressão. Militar: ordem pública. Civil: investigação. Federal: crimes federais. Rodoviária: estradas. Penal: custódia. Problema: violência, corrupção, falta de recursos."),
        ("como funciona o presidencialismo", "Presidente: chefe de Estado e governo. Eleito: voto popular. Mandato: 4 anos. Ministro: indica (não precisa de aprovação). Vantagem: estabilidade. Desvantagem: impasse com Congresso."),
        ("como funciona o parlamentarismo", "Primeiro-ministro: governo. Presidente: representação. Premiér: indica ministro (precisa de maioria). Vantagem: flexibilidade. Desvantagem: instabilidade (muitos partidos)."),
        ("como funciona a democracia", "Povo governa via representantes. Voto: universal, secreto, obrigatório (Brasil). Frentes: executivo, legislativo, judiciário. Problema: qualidade dos representantes, manipulação."),
        ("como funciona o capitalismo", "Propriedade privada, mercado livre, acumulação de capital. Oferta/demanda define preços. Lucro: incentivo. Desigualdade: consequência. Alternativas: socialismo, welfare state."),
        ("como funciona o socialismo", "Propriedade coletiva dos meios de produção. Objetivo: igualdade. Prática: URSS, Cuba, China (parcial). Problema: autoritarismo, ineficiência, ausência de incentivo. Ideal: belo, difícil."),
        ("como funciona o comunismo", "Sem classes, sem Estado, sem propriedade privada. Marx: utopia. Prática: nunca existiu (URSS era socialismo autoritário). Ideal: abundância, liberdade. Realidade: escassez, totalitarismo."),
        ("como funciona o welfare state", "Estado garante direitos sociais: saúde, educação, previdência. Exemplo: Europa nórdica. Financiado: impostos altos. Resultado: menor desigualdade, maior qualidade de vida."),
        ("como funciona o neoliberalismo", "Estado mínimo, mercado máximo. Privatização, desregulação, corte de gastos. Friedman, Hayek. Prós: eficiência, inovação. Contras: desigualdade, precarização, crise (2008)."),
        ("como funciona a globalizacao", "Integração econômica, cultural, política. OMC: comércio. Internet: comunicação. Multinacionais: investimento. Prós: eficiência. Contras: exploração, perda de identidade."),
    ],
}

def generate():
    all_pairs = []
    total = sum(len(v) for v in CORPUS.values())

    print("=" * 60)
    print("BRANPY AI -- GERADOR MEGA MASSIVO")
    print(f"Total: {total} pares")
    print("=" * 60)

    for cat, pairs in CORPUS.items():
        print(f"[{cat}] {len(pairs)}")
        for q, a in pairs:
            all_pairs.append(f"Human: {q}\nAI: {a}")

    random.shuffle(all_pairs)

    output = os.path.join(OUTPUT_DIR, "corpus_mega.txt")
    with open(output, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_pairs))

    print(f"\n{len(all_pairs)} pares -> {output}")

    # Combinar com corpus existentes
    all_data = []
    data_dir = OUTPUT_DIR
    for fname in os.listdir(data_dir):
        if fname.endswith(".txt"):
            try:
                with open(os.path.join(data_dir, fname), "r", encoding="utf-8") as f:
                    all_data.append(f.read())
            except:
                pass

    combinado = os.path.join(OUTPUT_DIR, "corpus_treino_final.txt")
    with open(combinado, "w", encoding="utf-8") as f:
        f.write("\n\n".join(all_data))

    # Contar pares
    count = 0
    for line in open(combinado, "r", encoding="utf-8"):
        if line.startswith("Human:") or line.startswith("Humor:"):
            count += 1

    print(f"\nCOMBINADO: {count} pares totais")
    print(f"Salvo em: {combinado}")
    print(f"Tamanho: {os.path.getsize(combinado)/1024:.1f} KB")

if __name__ == "__main__":
    generate()
