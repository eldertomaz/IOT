var config = {};

config.debug = process.env.DEBUG || false;

config.mqtt  = {};
config.mqtt.namespace = process.env.MQTT_NAMESPACE || 'sensores';
config.mqtt.hostname  = process.env.MQTT_HOSTNAME  || '35.198.8.16';
config.mqtt.port      = process.env.MQTT_PORT      || 1883;
config.mqtt.user      = process.env.MQTT_USER      || 'barcelos';
config.mqtt.password  = process.env.MQTT_PASSWORD  || 'sonyk800';

config.mongodb = {};
config.mongodb.hostname   = process.env.MONGODB_HOSTNAME   || 'localhost';
config.mongodb.port       = process.env.MONGODB_PORT       || 27017;
config.mongodb.database   = process.env.MONGODB_DATABASE   || 'mqtt';
config.mongodb.collection = process.env.MONGODB_COLLECTION || 'sensores';

module.exports = config;
