/**
 * Pós Graduação Internet das Coisas - CEFET-MG Disciplina: Programação para
 * Sistemas de Computação Exemplo prático de RESTFul com NodeJS e MongoDB
 */

/* Módulos Utilizados */
var express = require('express'); 
var cors = require('cors'); 
var bodyParser = require('body-parser'); 
var Atuador = require('./models/atuador_bd_connect'); // Modelos definidos
var mongoose = require('mongoose');
var mqtt = require('mqtt');

require('mongoose-middleware').initialize(mongoose);

mongoose.connect("mongodb://localhost:27017/sensores");
var client = mqtt.connect('tcp://localhost'); //inicia o mqtt

var app = express(); // Cria o app com Express
var router = express.Router();

app.use(cors()); // liberar todos os do app acessos CORS
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
	  var payload       = message.toString();
	  var message_topic = topic.toString();
	  
	  var atuador = new Atuador();

	  var d = new Date();
	 
	  atuador.time = d.getFullYear() + "-"
		+ ("00" + (d.getMonth() + 1)).slice(-2) + "-"
		+ ("00" + (d.getDate())).slice(-2) + " "
		+ d.toLocaleTimeString();
	 
	  atuador.valor = payload;

		atuador.save(function(error) { // insere no db
			if (error)
				console.log(error);

			console.log("Inserido com Sucesso!")
		});
	
});

/* Rota para acompanhar as requisições */
router.use(function(req, res, next) {
	console.log('Entrou na rota ');
	next(); // continua na próxima rota
});

//GET /
router.get('/', function(req, res) {
	res.json({
		message : 'API - IoT'
	});
});

//GET /atuador
router.route('/atuador').get(function(req, res) {
	var limit = parseInt(req.query._limit) || 20;
	var valor = req.query.valor || {$gte: 0};
	var sort = parseInt(req.query._sort) || -1;
	Atuador.
	find().
	where({ valor: valor }).
	limit(limit).
	sort({ _id: sort })
	.exec(function(err, atuador) {
		if (err)
			res.send(err);

		res.json(atuador);
	});
	console.log('GET /atuador');
});

router.route('/atuador/q').get(function(req, res) {
	Atuador.apiQuery(req.query).exec(function(err, atuador) {
		if (err)
			res.send(err);

		res.json(atuador);
	});
	console.log('GET /atuador/q');
});

//GET /atuador/recente
router.route('/atuador/recente').get(function(req, res) {
	var limit =  1;
	var sort  = -1;
	Atuador.
	find().
	limit(limit).
	sort({ _id: sort })
	.exec(function(err, atuador) {
		if (err)
			res.send(err);

		res.json(atuador);
	});
	console.log('GET /atuador/recente');
});

//GET /atuador/elevada
router.route('/atuador/elevada').get(function(req, res) {
	var limit = 10;
	var valor = {$gte: 30};
	var sort =  -1;
	
    Atuador.
	find().
	where({ valor: valor }).
	limit(limit).
	sort({ _id: sort })
	.exec(function(err, atuador) {
		if (err)
			res.send(err);

		res.json(atuador);
	});
    console.log('GET /atuador/elevada');
});


//GET /atuador/:id
router.route('/atuador/:id').get(function(req, res) {
	Atuador.findById(req.params.id, function(error, atuador) {
		if(error)
			res.send(error);

		res.json(atuador);
	});
	console.log('GET /atuador/:id');
});

/* POST /atuador {time:"..",valor:"..."} */
router.route('/atuador').post(function(req, res) {
	var atuador = new Atuador();

	atuador.time = req.body.time;
	atuador.valor = req.body.valor;

	client.publish('sensores',  atuador.valor); //MQTT: publica o valor da atuador no Tópico
	
	atuador.save(function(error) {
		if (error)
			res.send(error);

		res.json({
			message : 'atuador inserida e publicada!'
		});
	});
		
	console.log('POST /atuador');
});

//PUT /atuador/:id {time:"..",valor:"..."}
router.route('/atuador/:id').put(function(req, res) {
	Atuador.findById(req.params.id, function(error, atuador) {
		if(error)
			res.send(error);

		atuador.time = req.body.time;
		atuador.valor = req.body.valor;

		atuador.save(function(error) {
			if(error)
				res.send(error);
			res.json({ message: 'Atuador Atualizado!' });
		});
	});
	console.log('PUT /atuador/:id');
});

//DELETE /atuador/:id
router.route('/atuador/:id').delete(function(req, res) {
	Atuador.remove({
		_id: req.params.id
	}, function(error) {
		if(error)
			res.send(error);
		res.json({ message: 'Atuador excluída com Sucesso! '});
	});
	console.log('DELETE /atuador/:id');
});

app.use('/', router);

app.listen(3000);
console.log('Servidor executando.');
