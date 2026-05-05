import { Store as StoreIcon } from 'lucide-react';
import Product3DCard from '../Product3DCard';

export default function HomeProducts({
  productsRef,
  loadingProducts,
  products,
  pages,
  page,
  setPage
}) {
  return (
    <section ref={productsRef} className="max-w-7xl mx-auto px-4 pt-5 scroll-mt-20 bg-[#f5f5f7]">
      {loadingProducts && products.length === 0 ? (
        <div className="theme-product-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="rounded-[22px] bg-white border border-[#E5E7EB] overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-[#F3F4F6]" />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded bg-[#E5E7EB] w-4/5" />
                <div className="h-3 rounded bg-[#E5E7EB] w-2/3" />
                <div className="h-5 rounded bg-[#E5E7EB] w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="theme-product-grid">
            {products.map((product, index) => (
              <Product3DCard
                key={product.product_id || product.id || index}
                product={product}
                index={index}
              />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="px-5 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#111318] font-bold"
                >
                  Anterior
                </button>
              )}

              {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
                <button
                  key={i + 1}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  className={
                    page === i + 1
                      ? 'px-5 py-3 rounded-2xl bg-[#111318] text-white font-black'
                      : 'px-5 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#111318] font-bold'
                  }
                >
                  {i + 1}
                </button>
              ))}

              {page < pages && (
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  className="px-5 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#111318] font-bold"
                >
                  Próximo
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-14 text-center">
          <StoreIcon className="w-10 h-10 text-[#B7A88D] mx-auto mb-3" />
          <p className="text-[#6F6659]">Nenhum produto encontrado.</p>
        </div>
      )}
    </section>
  );
}
