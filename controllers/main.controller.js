const { ReE, ReS, to }         = require('../services/UtilService');
const axios = require('axios');


/**
 * Persons endpoint - insert manually
 */
const persons = async function(req, res){
	const body = req.body;
	if (!body.section || !body.persons || body.persons.length === 0)
		return ReE(res, { message: 'INVALID_DATA' });

	// Ping Service Registry (cPanel) to get location of service with that id
	let [err, response] = await to(axios.get('http://cpanel.default.svc.cluster.local:1234/sections/' + body.section));
	if (err) return ReE(res, err);
	return ReS(res, {message: 'Success CPANEL', data: response.data});
	// Forward persons to right section and use location(address) from service registry
	let sectionAddress = response.data.section.address;
	[err, response] = await to(axios.post(sectionAddress + '/persons', {
		persons: body.persons
	}));
	if (err) return ReE(res, err);
	return ReS(res, {message: 'Success'});
};
module.exports.persons = persons;

/**
 * Frame endpoint - receiving from CameraAgents
 */
const frame = async function(req, res){
	const body = req.body;
	if (!body.timestamp || !body.image || !body.section || !body.event) return ReE(res, { message: 'INVALID_DATA' });

	// Forward to FaceRecognition
	// FaceRecognition will forward the response to provided destination -> Section
	let [err, response] = await to(axios.post('http://face-recognition:8080/frame', {
		...body,
		destination: 'http://alert:9999'
	}));
	if (err) return ReE(res, err);


	let data = {
		timestamp: body.timestamp,
		image: body.image,
		section: body.section,
		event: body.event,
		// destination: 'http://section:8888'
	};
	// Forward to ImageAnalysis
	[err, response] = await to(axios.post('http://image-analysis:8080/frame', data));
	if (err) {
		return ReE(res, err);
	}

	// Forward to Sector if person detected
	if (response.data.persons && response.data.persons.length > 0) {
		[err, response] = await to(axios.post('http://section:8888/persons', {
			persons: response.data.persons
		}));
		if (err) return ReE(res, err);
	}

	return ReS(res, {message: 'Success'});
};
module.exports.frame = frame;
