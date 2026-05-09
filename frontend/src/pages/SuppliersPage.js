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
    <div className="min-h-screen bg-[#f5f5f7] text-[#12141A] py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B98228] mb-2">
            Fornecedores Globais
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[#111318]">
            Conecte com fábricas e distribuidoras
          </h1>
          <p className="text-[#606875] mt-3 text-base max-w-2xl">
            Acesse fornecedores verificados para comprar em volume com os melhores preços.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white p-6 rounded-[20px] border border-[#E5E7EB] shadow-[0_10px_22px_rgba(70,50,25,0.06)] hover:-translate-y-0.5 transition"
            >
              <h2 className="text-lg font-black text-[#111318]">
                {supplier.name}
              </h2>

              <p className="text-[#606875] mt-3 text-sm">
                {supplier.description}
              </p>

              <p className="text-sm mt-4 text-[#B98228] font-bold">
                Pedido mínimo: {supplier.minOrder}
              </p>

              <button className="mt-5 w-full bg-[#111318] text-white px-4 py-2.5 rounded-[14px] font-bold hover:bg-[#252832] transition">
                Ver produtos
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
