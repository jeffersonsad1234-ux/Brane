import { ChevronRight, Grid3X3, Sparkles } from 'lucide-react';

export default function HomeCategories({ environments, category, selectCategory }) {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-4 bg-transparent">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
          <Sparkles className="text-[#C4892F]" size={17} />
          Navegue por ambientes
        </h2>

        <button
          type="button"
          onClick={() => selectCategory('')}
          className="text-sm font-bold text-[#8A6326] hover:text-[#111318] inline-flex items-center gap-1"
        >
          Ver todas
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {environments.map((cat) => {
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className={
                'group text-left relative min-h-[60px] rounded-[16px] overflow-hidden border bg-white shadow-[0_10px_22px_rgba(70,50,25,0.06)] hover:-translate-y-0.5 transition ' +
                (category === cat.id ? 'border-[#D4A24C]' : 'border-white')
              }
            >
              <div className="absolute inset-0" style={{ background: cat.image }} />
              <div className="absolute inset-x-4 bottom-0 h-[2px] bg-[#D4A24C] shadow-[0_0_18px_rgba(212,162,76,0.85)]" />

              <div className="relative h-full p-2.5 flex flex-col justify-end text-white">
                <Icon size={18} className="mb-0.5 text-[#F1D28A]" />
                <p className="text-[10px] font-black leading-tight">
                  {cat.name}
                </p>
                <p className="text-[9px] text-white/75">
                  Ver mais
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => selectCategory('')}
          className={
            'group relative min-h-[60px] rounded-[16px] overflow-hidden border bg-white shadow-[0_10px_22px_rgba(70,50,25,0.06)] hover:-translate-y-0.5 transition ' +
            (!category ? 'border-[#D4A24C]' : 'border-[#D4A24C]/50')
          }
        >
          <div className="relative h-full p-2.5 flex flex-col items-center justify-center text-[#111318]">
            <Grid3X3 size={20} className="mb-0.5 text-[#111318]" />
            <p className="text-[10px] font-black">
              Ver todas
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}
