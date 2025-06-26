// middleware/logAction.js
const { logActivity } = require('../controllers/activityController');

module.exports = (action) => async (req, res, next) => {
  await logActivity(req.user, action);
  next();
};
