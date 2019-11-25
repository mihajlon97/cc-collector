const MainController = require('../controllers/main.controller');

module.exports = function (express) {
	const router = express.Router();

	// ----------- Routes -------------
	router.post('/frame',           MainController.frame);
	router.post('/persons',         MainController.persons);

	return router;
};
