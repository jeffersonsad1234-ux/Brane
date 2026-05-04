import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import AIAssistantPanel from "../components/AIAssistantPanel";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const STATES_AND_CITIES = {
  "Acre": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá"],
  "Alagoas": ["Maceió", "Arapiraca", "Palmeira dos Índios"],
  "Amapá": ["Macapá", "Santana", "Oiapoque"],
  "Amazonas": ["Manaus", "Parintins", "Itacoatiara"],
  "Bahia": ["Salvador", "Feira de Santana", "Vitória da Conquista"],
  "Ceará": ["Fortaleza", "Caucaia", "Juazeiro do Norte"],
  "Distrito Federal": ["Brasília", "Taguatinga", "Ceilândia"],
  "Espírito Santo": ["Vitória", "Vila Velha", "Serra"],
  "Goiás": ["Goiânia", "Anápolis", "Rio Verde"],
  "Maranhão": ["São Luís", "Imperatriz", "Caxias"],
  "Mato Grosso": ["Cuiabá", "Várzea Grande", "Rondonópolis"],
  "Mato Grosso do Sul": ["Campo Grande", "Dourados", "Três Lagoas"],
  "Minas Gerais": ["Belo Horizonte", "Uberlândia", "Contagem"],
  "Pará": ["Belém", "Ananindeua", "Santarém", "Marabá"],
  "Paraíba": ["João Pessoa", "Campina Grande", "Patos"],
  "Paraná": ["Curitiba", "Londrina", "Maringá"],
  "Pernambuco": ["Recife", "Olinda", "Caruaru"],
  "Piauí": ["Teresina", "Parnaíba", "Picos"],
  "Rio de Janeiro": ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
  "Rio Grande do Norte": ["Natal", "Mossoró", "Parnamirim"],
  "Rio Grande do Sul": ["Porto Alegre", "Caxias do Sul", "Pelotas"],
  "Rondônia": ["Porto Velho", "Ji-Paraná", "Ariquemes"],
  "Roraima": ["Boa Vista", "Rorainópolis", "Caracaraí"],
  "Santa Catarina": ["Florianópolis", "Joinville", "Blumenau"],
  "São Paulo": ["São Paulo", "Campinas", "Guarulhos", "Osasco"],
  "Sergipe": ["Aracaju", "Lagarto", "Itabaiana"],
  "Tocantins": ["Palmas", "Araguaína", "Gurupi"]
};

export default function AddStoreProductPage({ mode = "store" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const storeId = searchParams.get("store_id") || "";
  const isFeed = mode === "feed";

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!token) return;

    axios
      .get(API + "/seller/terms-status", {
        headers: {
          Authorization: "Bearer " + token
        }
      })
      .then((r) => {
        if (r.data?.accepted) {
          setAlreadyAccepted(true);
          setAcceptedTerms(true);
        }
      })
      .catch(() => {});
  }, [token]);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);

    const mapped = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotos((prev) => [...prev, ...mapped]);
  };

  const removePhoto = (indexToRemove) => {
    setPhotos((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  };

  const handleAcceptTermsAndPublish = async () => {
    if (!productName.trim()) {
      alert("Digite o nome do produto.");
      return;
    }

    if (!price) {
      alert("Digite o preço.");
      return;
    }

    if (!category) {
      alert("Selecione a categoria.");
      return;
    }

    if (!description.trim()) {
      alert("Digite a descrição.");
      return;
    }

    if (!stateName) {
      alert("Selecione o estado.");
      return;
    }

    if (!city) {
      alert("Selecione a cidade.");
      return;
    }

    if (photos.length === 0) {
      alert("Adicione pelo menos uma foto.");
      return;
    }

    if (!acceptedTerms) {
      alert("Aceite os termos para continuar.");
      return;
    }

    if (!token) {
      alert("Você precisa estar logado.");
      return;
    }

    setPublishing(true);

    try {
      if (!alreadyAccepted) {
        await axios.post(
          API + "/seller/accept-terms",
          {},
          {
            headers: {
              Authorization: "Bearer " + token
            }
          }
        );
      }

      const imagesBase64 = await Promise.all(
        photos.map((photo) => fileToBase64(photo.file))
      );

      const payload = {
        title: productName,
        description,
        price: Number(String(price).replace(",", ".")),
        category,
        state: stateName,
        city,
        images: imagesBase64,
        photos: imagesBase64,
        publish_target: isFeed ? "feed" : "store"
      };

      if (!isFeed && storeId) {
        payload.store_id = storeId;
      }

      await axios.post(
        API + "/products",
        payload,
        {
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      alert("Produto publicado com sucesso!");

      if (isFeed) {
        navigate("/market");
      } else {
        navigate("/stores");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao publicar produto.");
    } finally {
      setPublishing(false);
    }
  };

  const cities = stateName
    ? STATES_AND_CITIES[stateName] || []
    : [];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {isFeed ? "Publicar no Feed" : "Cadastrar Produto da Loja"}
            </h1>
            <p className="text-gray-400">
              {isFeed
                ? "Seu produto será publicado no feed principal da Marketplace."
                : "Preencha as informações abaixo para anunciar seu produto na loja."}
            </p>
          </div>

          {/* Botão IA para mobile */}
          <button
            onClick={() => setShowAIModal(true)}
            className="lg:hidden bg-[#D4A24C] text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <span>🤖</span>
            Assistente IA
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          {/* Formulário Principal */}
          <div className="space-y-6">
            <div className="bg-[#15151D] rounded-2xl p-6 border border-[#1E2230]">
              <h2 className="text-xl font-semibold mb-4">Informações do Produto</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none"
                />

                <input
                  type="number"
                  placeholder="Preço (R$)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none"
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="">Selecione a categoria</option>
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Roupas">Roupas</option>
                  <option value="Casa">Casa</option>
                  <option value="Beleza">Beleza</option>
                  <option value="Acessórios">Acessórios</option>
                  <option value="Outros">Outros</option>
                </select>

                <textarea
                  rows="4"
                  placeholder="Descrição detalhada do produto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="bg-[#15151D] rounded-2xl p-6 border border-[#1E2230]">
              <h2 className="text-xl font-semibold mb-4">Localização</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={stateName}
                  onChange={(e) => {
                    setStateName(e.target.value);
                    setCity("");
                  }}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="">Selecione o Estado</option>
                  {Object.keys(STATES_AND_CITIES).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!stateName}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="">
                    {stateName
                      ? "Selecione a cidade"
                      : "Escolha primeiro o estado"}
                  </option>
                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#15151D] rounded-2xl p-6 border border-[#1E2230]">
              <h2 className="text-xl font-semibold mb-4">Imagens do Produto</h2>

              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotos}
                  className="w-full p-4 rounded-xl bg-[#0B0B0F] border border-[#1E2230] focus:border-[#D4A24C] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#D4A24C] file:text-black hover:file:bg-[#C49542]"
                />

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Produto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[#1E2230]"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!alreadyAccepted && (
              <div className="bg-[#15151D] rounded-2xl p-6 border border-[#1E2230]">
                <label className="flex gap-3 items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-300">
                    Aceito os termos de vendedor da plataforma BRANE.
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={handleAcceptTermsAndPublish}
              disabled={publishing || (!alreadyAccepted && !acceptedTerms)}
              className="w-full bg-[#D4A24C] text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C49542] transition-colors"
            >
              {publishing ? "Publicando..." : "Publicar Produto"}
            </button>
          </div>

          {/* Painel IA - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <AIAssistantPanel
                onGenerateAd={(data) => {
                  setProductName(data.productName || "");
                  setGeneratedAd(data);
                  setIsGeneratingAd(false);
                }}
                onImproveAd={() => {
                  setIsGeneratingAd(true);
                  setTimeout(() => {
                    setIsGeneratingAd(false);
                  }, 1500);
                }}
                onGenerateNew={() => {
                  setGeneratedAd(null);
                  setProductName("");
                }}
                generatedAd={generatedAd}
                isGenerating={isGeneratingAd}
              />
            </div>
          </div>
        </div>

        {/* Modal IA - Mobile */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:hidden">
            <div className="bg-[#15151D] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#1E2230]">
                <h3 className="text-lg font-semibold">Assistente IA</h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <AIAssistantPanel
                  onGenerateAd={(data) => {
                    setProductName(data.productName || "");
                    setGeneratedAd(data);
                    setIsGeneratingAd(false);
                    setShowAIModal(false);
                  }}
                  onImproveAd={() => {
                    setIsGeneratingAd(true);
                    setTimeout(() => {
                      setIsGeneratingAd(false);
                    }, 1500);
                  }}
                  onGenerateNew={() => {
                    setGeneratedAd(null);
                    setProductName("");
                    setShowAIModal(false);
                  }}
                  generatedAd={generatedAd}
                  isGenerating={isGeneratingAd}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
