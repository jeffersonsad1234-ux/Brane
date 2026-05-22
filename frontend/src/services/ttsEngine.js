/**
 * TTS Engine — placeholder. Voice generation moved to separate module.
 * See: brane-media-worker/ (módulo futuro separado)
 */
const VOZES = [
  { id: 'pt-BR-FranciscaNeural', nome: 'Francisca', genero: 'Feminino', estilo: 'natural e calorosa' },
  { id: 'pt-BR-AntonioNeural', nome: 'Antonio', genero: 'Masculino', estilo: 'profissional' },
  { id: 'pt-BR-ThalitaNeural', nome: 'Thalita', genero: 'Feminino', estilo: 'jovem e animada' },
  { id: 'pt-BR-BrendaNeural', nome: 'Brenda', genero: 'Feminino', estilo: 'conversacional' },
  { id: 'pt-BR-DonatoNeural', nome: 'Donato', genero: 'Masculino', estilo: 'calmo e sério' },
  { id: 'pt-BR-ElzaNeural', nome: 'Elza', genero: 'Feminino', estilo: 'madura e firme' },
  { id: 'pt-BR-FabioNeural', nome: 'Fabio', genero: 'Masculino', estilo: 'entusiasmado' },
  { id: 'pt-BR-GiovannaNeural', nome: 'Giovanna', genero: 'Feminino', estilo: 'criativa' },
  { id: 'pt-BR-HumbertoNeural', nome: 'Humberto', genero: 'Masculino', estilo: 'sério' },
  { id: 'pt-BR-JulioNeural', nome: 'Julio', genero: 'Masculino', estilo: 'jovem' },
  { id: 'pt-BR-LeilaNeural', nome: 'Leila', genero: 'Feminino', estilo: 'elegante' },
  { id: 'pt-BR-LeticiaNeural', nome: 'Leticia', genero: 'Feminino', estilo: 'amigável' },
  { id: 'pt-BR-ManuelaNeural', nome: 'Manuela', genero: 'Feminino', estilo: 'expressiva' },
  { id: 'pt-BR-NicolasNeural', nome: 'Nicolas', genero: 'Masculino', estilo: 'carismático' },
  { id: 'pt-BR-ValeriaNeural', nome: 'Valeria', genero: 'Feminino', estilo: 'suave' },
  { id: 'pt-BR-YaraNeural', nome: 'Yara', genero: 'Feminino', estilo: 'vibrante' },
];

export function getVozesDisponiveis() { return VOZES; }
export function getVoiceName(id) { return VOZES.find(v => v.id === id)?.nome || id; }
