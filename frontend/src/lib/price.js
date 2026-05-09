/**
 * Formata valor monetário em BRL (R$ X.XXX,XX) - sempre com 2 casas decimais
 */
export function formatBRL(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Divide preço em inteiro e centavos para exibição estilizada (ex.: R$ 18,00)
 * SEMPRE retorna 2 dígitos de centavos (padStart).
 */
export function splitPrice(value) {
  const n = Number(value) || 0;
  const whole = Math.floor(n);
  const cents = Math.round((n - whole) * 100).toString().padStart(2, '0');
  return { whole, cents };
}
