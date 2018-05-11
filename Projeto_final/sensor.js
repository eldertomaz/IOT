/**
 * Pós Graduação Internet das Coisas - CEFET-MG Disciplina: Programação para
 * Sistemas de Computação Exemplo prático de RESTFul com NodeJS e MongoDB
 */

/* Módulos Utilizados */
var express = require('express'); 
var cors = require('cors'); 
var bodyParser = require('body-parser'); 
var sensor = require('./models/sensor_bd_connect'); // Modelos definidos
var mongoose = require('mongoose');

var url = "mongodb://localhost:27017/mqtt";
mongoose.connect(url);

var app = express(); // Cria o app com Express
var router = express.Router();

app.use(cors()); // liberar todos os do app acessos CORS
app.use(bodyParser.urlencoded({ 
	extended : true
})); 
app.use(bodyParser.json()); // configurações do body parser

/* Rota para acompanhar as requisições */
router.use(function(req, res, next) {
	console.log('Entrou na rota ');
	next(); // continua na próxima rota
});

//GET /
router.get('/', function(req, res) {
	res.json({
		message : 'Sensor - API IoT'
	});
});

//GET /sensor
router.route('/sensor').get(function(req, res) {
	sensor.find(function(err, sensor) {
		if (err)
			res.send(err);

		res.json(sensor);
	});
	console.log('GET /sensor');
});

//GET /sensor/:id
router.route('/sensor/:id').get(function(req, res) {
	sensor.findById(req.params.id, function(error, sensor) {
		if(error)
			res.send(error);

		res.json(sensor);
	});
	console.log('GET /sensor/:id');
});

/* POST /sensor {time:"..",valor:"..."} */
router.route('/sensor').post(function(req, res) {
	var sensor = new sensor();

	sensor.time = req.body.time;
	sensor.valor = req.body.valor;

	sensor.save(function(error) {
		if (error)
			res.send(error);

		res.json({
			message : 'sensor atualizado!'
		});
	});
	console.log('POST /sensor');
});

//PUT /sensor/:id {time:"..",valor:"..."}
router.route('/sensor/:id').put(function(req, res) {
	sensor.findById(req.params.id, function(error, sensor) {
		if(error)
			res.send(error);

		sensor.time = req.body.time;
		sensor.valor = req.body.valor;

		sensor.save(function(error) {
			if(error)
				res.send(error);
			res.json({ message: 'sensor Atualizado!' });
		});
	});
	console.log('PUT /sensor/:id');
});

//DELETE /sensor/:id
router.route('/sensor/:id').delete(function(req, res) {
	sensor.remove({
		_id: req.params.id
	}, function(error) {
		if(error)
			res.send(error);
		res.json({ message: 'sensor excluída com Sucesso! '});
	});
	console.log('DELETE /sensor/:id');
});

app.use('/', router);

app.listen(3001);
console.log('Servidor executando.');
