/** Pós Graduação Internet das Coisas - CEFET-MG
	Disciplina: Programação para Sistemas de Computação
	Exemplo prático de RESTFul com NodeJS e MongoDB
	Modelo Atuador
 */
 
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment'); 
var mongooseApiQuery = require('mongoose-api-query'); 

var AtuadorSchema = new Schema({
    time: String,
    valor: String
});

autoIncrement.initialize(mongoose.connection);
AtuadorSchema.plugin(autoIncrement.plugin, 'atuador');
AtuadorSchema.plugin(mongooseApiQuery); 
module.exports = mongoose.model('atuador', AtuadorSchema);

