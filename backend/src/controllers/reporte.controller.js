const service = require('../services/reporte.service');

const getDashboard = async (req, res, next) => {
  try {
    const data = await service.getDashboardData();
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const getConsolidado = async (req, res, next) => {
  try {
    const data = await service.getConsolidatedReport();
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getConsolidado };
