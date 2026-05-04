import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function AddDesapegaProductPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    productCondition: "",
    state: "",
    city: "",
    description: ""
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then(setStates)
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/" + form.state + "/municipios?orderBy=nome")
      .then((res) => res.json())
      .then(setCities)
      .catch(() => setCities([]));
  }, [form.state]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const base64Photos = await Promise.all(files.map(fileToBase64));

    setPhotos((prev) => [...prev, ...base64Photos]);
  };

  const handleVideo = async (e) => {
    const file = e.target.files && e.target.files[0];

    if (!file) return;

    const maxSize = 60 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("O vídeo está muito grande. Envie um vídeo de até 60MB.");
      e.target.value = "";
      return;
    }

    const base64Video = await fileToBase64(file);

    setVideo(base64Video);
    setVideoName(file.name);
  };

  const removePhoto = (indexToRemove) => {
    setPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoName("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { city: "" } : {})
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!["seller", "admin"].includes(user.role)) {
      alert("Apenas vendedores podem anunciar produtos.");
      return;
    }

    if (
      !form.title ||
      !form.price ||
      !form.category ||
      !form.productCondition ||
      !form.state ||
      !form.city ||
      !form.description
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (photos.length === 0) {
      alert("Adicione pelo menos uma foto do produto.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        API + "/products",
        {
          title: form.title,
          price: Number(String(form.price).replace(",", ".")),
          category: form.category,
          city: form.city,
          state: form.state,
          location: form.city + " - " + form.state,
          description: form.description,
          images: photos,
          video: video,
          product_type: "secondhand",
          source: "desapega",
          condition: form.productCondition,
          product_condition: form.productCondition,
          status: "active"
        },
        {
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      alert("Produto publicado com sucesso!");
      navigate("/desapega");
    } catch (error) {
      console.error(error);
      alert((error.response && error.response.data && error.response.data.detail) || "Erro ao publicar produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Cadastrar Produto no Desapega
        </h1>

        <div className="mb-6 p-4 rounded-xl bg-[#5B1CB5]/10 border border-[#5B1CB5]/30">
          <p className="text-sm text-[#E6E6EA]">
            <strong className="text-[#A78BFA]">Desapega é gratuito.</strong> A BRANE não cobra comissão e não exige aceite de termos. Você combina tudo direto com o comprador via chat.
          </p>
        </div>

        <div className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            type="text"
            placeholder="Nome do produto"
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          />

          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            type="text"
            placeholder="Preço"
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          >
            <option value="">Selecione a categoria</option>
            <option value="Roupas">Roupas</option>
            <option value="Calçados">Calçados</option>
            <option value="Acessórios">Acessórios</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Casa">Casa</option>
            <option value="Beleza">Beleza</option>
            <option value="Esportes">Esportes</option>
            <option value="Infantil">Infantil</option>
            <option value="Outros">Outros</option>
          </select>

          <select
            name="productCondition"
            value={form.productCondition}
            onChange={handleChange}
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          >
            <option value="">Estado do produto</option>
            <option value="new">Novo</option>
            <option value="semi_new">Seminovo</option>
            <option value="used_good">Usado em bom estado</option>
            <option value="used">Usado</option>
          </select>

          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          >
            <option value="">Selecione o estado</option>
            {states.map((state) => (
              <option key={state.id} value={state.sigla}>
                {state.nome}
              </option>
            ))}
          </select>

          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            disabled={!form.state}
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230] disabled:opacity-50"
          >
            <option value="">Selecione a cidade</option>
            {cities.map((city) => (
              <option key={city.id} value={city.nome}>
                {city.nome}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descrição do produto"
            rows="5"
            className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
          />

          <div>
            <label className="block text-sm text-gray-300 mb-3">
              Fotos do produto
            </label>

            <div className="flex flex-wrap gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#1E2230] bg-[#15151D]"
                >
                  <img
                    src={photo}
                    alt={"Foto " + (index + 1)}
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ×
                  </button>
                </div>
              ))}

              <label className="w-28 h-28 rounded-xl border-2 border-dashed border-[#D4A24C]/60 bg-[#15151D] flex items-center justify-center text-[#D4A24C] cursor-pointer hover:bg-[#D4A24C]/10">
                <span className="text-3xl">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotos}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Vídeo do produto <span className="text-gray-500">(opcional)</span>
            </label>

            <input
              type="file"
              accept="video/*"
              onChange={handleVideo}
              className="w-full p-4 rounded-xl bg-[#15151D] border border-[#1E2230]"
            />

            {video && (
              <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-400">
                  Vídeo carregado com sucesso: {videoName}
                </p>

                <video
                  src={video}
                  controls
                  className="mt-3 w-full max-h-64 rounded-xl bg-black"
                />

                <button
                  type="button"
                  onClick={removeVideo}
                  className="mt-3 text-xs text-red-400 hover:text-red-300"
                >
                  Remover vídeo
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#D4A24C] text-black font-bold py-4 rounded-xl disabled:opacity-60"
          >
            {loading ? "Publicando..." : "Publicar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
