export default function HomeBanners({ banners, onGoProducts }) {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-8 bg-white">
      <div className="grid md:grid-cols-4 gap-4">
        {banners.map((banner) => {
          const Icon = banner.icon;

          return (
            <button
              key={banner.title}
              type="button"
              onClick={onGoProducts}
              className={
                'text-left rounded-[26px] p-5 min-h-[120px] bg-gradient-to-br ' +
                banner.tone +
                ' text-white border border-white/10 shadow-[0_16px_35px_rgba(17,19,24,0.12)] relative overflow-hidden group'
              }
            >
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#D4A24C]/18 blur-2xl" />

              <div className="relative z-10">
                <Icon size={25} className="text-[#F1D28A] mb-3" />
                <h3 className="font-black text-base">{banner.title}</h3>
                <p className="text-xs text-white/70 mt-1">{banner.text}</p>
                <p className="text-[#F1D28A] font-black mt-3">{banner.value}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
