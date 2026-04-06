const repo = require('../repositories/reporte.repository');

const getDashboardData = async () => {
  const stats = await repo.getDashboardStats();
  const recent = await repo.getRecentTransactions(5);
  return { stats, recent };
};

const getConsolidatedReport = async () => {
  return await repo.getConsolidatedData();
};

module.exports = { getDashboardData, getConsolidatedReport };
