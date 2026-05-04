import { useEffect, useState } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    // MOCK inicial (depois vira API)
    setSuppliers([
      {
        id: 1,
        name: "Fornecedor Tech Global",
        description: "Eletrônicos direto de fábrica",
        minOrder: "100 unidades",
      },
      {
        id: 2,
        name: "Distribuidora Fashion",
        description: "Roupas no atacado",
        minOrder: "50 peças",
      },
      {
        id: 3,
        name: "Importadora Prime",
        description: "Produtos importados",
        minOrder: "200 unidades",
      },
    ]);
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Fornecedores Globais 🌍
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-[#0f1115] p-5 rounded-2xl border border-white/10"
          >
            <h2 className="text-xl font-bold">
              {supplier.name}
            </h2>

            <p className="text-white/70 mt-2">
              {supplier.description}
            </p>

            <p className="text-sm mt-3 text-[#8A2CFF]">
              Pedido mínimo: {supplier.minOrder}
            </p>

            <button className="mt-4 bg-[#8A2CFF] px-4 py-2 rounded-xl">
              Ver produtos
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
