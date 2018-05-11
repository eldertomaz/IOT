/**
 * Pós Graduação Internet das Coisas - CEFET-MG Disciplina: Programação para
 * Sistemas de Computação - RESTFul com NodeJS e MongoDB
 */

/* Módulos Utilizados */
var express = require('express'); 
var cors = require('cors'); 
var bodyParser = require('body-parser'); 
var Sensor = require('./models/esquema-sensor'); 	// Modelo definido do Sensor
var mongoose = require('mongoose');
var mqtt = require('mqtt');

require('mongoose-middleware').initialize(mongoose);

mongoose.connect("mongodb://localhost:27017/sensores");	// Conecta no MongoDb

var client = mqtt.connect('tcp://localhost:1883'); 		// Inicia o mqtt

var app = express(); 			// Cria o app com Express
var router = express.Router();	

app.use(cors()); 				// liberar todos os do app acessos CORS
app.use(bodyParser.urlencoded({ 
	extended : true
})); 

app.use(bodyParser.json()); // configurações do body parser

client.on('connect', function () {
   	 client.subscribe('sensores'); //conecta e assina o tópico MQTT
});


client.on('message', function (topic, message) { //aguarda mensagem do tópico assinado MQTT 
	console.log(topic.toString());
	console.log(message.toString());

	var payload = message.toString();
	var message_topic = topic.toString();
	var sensor = new Sensor();
	var JSONParsed = JSONParse(payload);
	var d = new Date();
	
	sensor.local = JSONParsed.local;
	sensor.time = d.getFullYear() + "-"
		+ ("00" + (d.getMonth() + 1)).slice(-2) + "-"
		+ ("00" + (d.getDate())).slice(-2) + " "
		+ d.toLocaleTimeString();
	sensor.temp = JSONParsed.temp;
	sensor.lumi = JSONParsed.lumi;

	sensor.save(function(error) { // insere registro do mqtt no MongoDb
		if (error)
			console.log(error);
			console.log("Inserido com Sucesso!")
	});
});

/* Rota para acompanhar as requisições */
router.use(function(req, res, next) {
	console.log('Entrou na rota');
	next(); // continua na próxima rota
});

//GET /
router.get('/', function(req, res) {
	res.json({
		message : 'IoT - Servidor Ativo!'
	});
});

//GET /sensor
router.route('/sensor').get(function(req, res) {
	var limit = parseInt(req.query._limit) || 20;
	var valor = req.query.valor || {$gte: 0};
	var sort = parseInt(req.query._sort) || -1;
	Sensor.
	find().
	where({ valor: valor }).
	limit(limit).
	sort({ _id: sort })
	.exec(function(err, sensor) {
		if (err)
			res.send(err);

		res.json(sensor);
	});
	console.log('GET /sensor');
});

router.route('/sensor/q').get(function(req, res) {
	Sensor.apiQuery(req.query).exec(function(err, sensor) {
		if (err)
			res.send(err);

		res.json(sensor);
	});
	console.log('GET /sensor/q');
});

//GET /sensor/recente
router.route('/sensor/recente').get(function(req, res) {
	var limit =  1;
	var sort  = -1;
	Sensor.
	find().
	limit(limit).
	sort({ _id: sort })
	.exec(function(err, sensor) {
		if (err)
			res.send(err);

		res.json(sensor);
	});
	console.log('GET /sensor/recente');
});

// GET /sensor/elevada
// router.route('/sensor/elevada').get(function(req, res) {
	// var limit = 10;
	// var valor = {$gte: 30};
	// var sort =  -1;
	
    // Sensor.
	// find().
	// where({ valor: valor }).
	// limit(limit).
	// sort({ _id: sort })
	// .exec(function(err, sensor) {
		// if (err)
			// res.send(err);

		// res.json(sensor);
	// });
    // console.log('GET /sensor/elevada');
// });


//GET /sensor/:id
router.route('/sensor/:id').get(function(req, res) {
	Sensor.findById(req.params.id, function(error, sensor) {
		if(error)
			res.send(error);

		res.json(sensor);
	});
	console.log('GET /sensor/:id');
});

/* POST /sensor {time:"..",valor:"..."} */
router.route('/sensor').post(function(req, res) {
	var sensor = new Sensor();
	sensor.local = req.body.local;
	sensor.time = req.body.time;
	sensor.temp = req.body.temp;
	sensor.lumi = req.body.lumi;
	
	client.publish('sensores',  sensor); //MQTT: publica o valor da sensor no Tópico
	
	sensor.save(function(error) {
		if (error)
			res.send(error);

		res.json({
			message : 'sensor inserida e publicada!'
		});
	});
		
	console.log('POST /sensor');
});

//PUT /sensor/:id {time:"..",valor:"..."}
router.route('/sensor/:id').put(function(req, res) {
	Sensor.findById(req.params.id, function(error, sensor) {
		if(error)
			res.send(error);

		sensor.time = req.body.time;
		sensor.valor = req.body.valor;

		sensor.save(function(error) {
			if(error)
				res.send(error);
			res.json({ message: 'Sensor Atualizado!' });
		});
	});
	console.log('PUT /sensor/:id');
});

//DELETE /sensor/:id
router.route('/sensor/:id').delete(function(req, res) {
	Sensor.remove({
		_id: req.params.id
	}, function(error) {
		if(error)
			res.send(error);
		res.json({ message: 'Sensor excluída com Sucesso! '});
	});
	console.log('DELETE /sensor/:id');
});

app.use('/', router);

app.listen(3000);
console.log('Servidor executando.');
