/** Pós Graduação Internet das Coisas - CEFET-MG
	Disciplina: Programação para Sistemas de Computação
	Exemplo prático de RESTFul com NodeJS e MongoDB
	Modelo Sensor
 */
 
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment'); 
var mongooseApiQuery = require('mongoose-api-query'); 

var SensorSchema = new Schema({
    time: String,
    message: String
});

autoIncrement.initialize(mongoose.connection);
SensorSchema.plugin(autoIncrement.plugin, 'sensores');
SensorSchema.plugin(mongooseApiQuery); 
module.exports = mongoose.model('sensores', SensorSchema);

