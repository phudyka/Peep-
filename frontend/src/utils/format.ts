export const formatNumber = (n: number, decimals = 2): string => {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
};
