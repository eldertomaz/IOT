/*
  ESP8266 NODEMCU SENSOR DE TEMPERATURA, MOVIMENTO E LUMINOSIDADE MULTIPLEXADO / WiFi / MQTT
  Alunos: Alexandre Antunes Barcelos
          Elder 
  Data:   17/04/2018

  Este código prove a leitura de três sensores, sendo um de temperatura (LM35), um sensor de movimento (PIR) e um de Luminosidade (LDR),
  pela porta analogica. Atraves da multiplexacao (CI SD4066BE) é possível fazer a leitura dos tres sensores com apenas uma porta analógica. Após a leitura
  os dados são enviados via rede WiFi ao Broker MQTT hospedado no Google Coud para que posteriormente possam ser tratados.
*/

#include <ESP8266WiFi.h>  // Importa a Biblioteca ESP8266WiFi
#include <PubSubClient.h> // Importa a Biblioteca PubSubClient
#include <WiFiUdp.h>      // Wifi UDP
#include <ArduinoJson.h>  // JSon para Arduino

//defines de id mqtt e tópicos para publicação e subscribe
#define TOPICO_SUBSCRIBE "sensores"         //tópico MQTT de escuta
#define TOPICO_PUBLISH "sensores"           //tópico MQTT de envio de informações para Broker
#define ID_MQTT "RoomSense"                 //id mqtt (para identificação de sessão)

//defines - mapeamento de pinos do NodeMCU
#define D0    16
#define D1    5
#define D2    4
#define D3    0
#define D4    2
#define D5    14
#define D6    12
#define D7    13
#define D8    15
#define D9    3
#define D10   1

// Wifi configuration
const char* SSID = "IoT";                     // SSID / nome da rede WI-FI
const char* PASSWORD = "12345678";            // Senha da rede WI-FI

// MQTT configuration
const char* BROKER_MQTT = "35.198.8.16";      // URL/IP do broker MQTT
const char* mqttUser = "";
const char* mqttPassword = "";
int BROKER_PORT = 1883;                       // Porta do Broker MQTT

int portaAnalogica = 0;
int sensor_PIR = 12;
int ativa_LM35 = 13;
int ativa_LDR = 15;
int luminosidade = 0;
float temperatura = 0;
float milivolts = 0;

//Variáveis e objetos globais
WiFiClient espClient;                         // Cria o objeto espClient
PubSubClient MQTT(espClient);                 // Instancia o Cliente MQTT passando o objeto espClient

String payload;

//Prototipos
void initSerial();
void initWiFi();
void initMQTT();
void reconectWiFi();
void mqtt_callback(char* topic, byte* payload, unsigned int length);
void VerificaConexoesWiFIEMQTT(void);

WiFiClient wifiClient;
PubSubClient client(wifiClient);

void setup() {
  //inicializações:
  initSerial();
  initWiFi();
  initMQTT();

  pinMode(LED_BUILTIN, OUTPUT);     // Inicializa o LED_BUILTIN (interno) como status do sensor PIR (detecção de movimento)
  pinMode(ativa_LDR, OUTPUT);     
  pinMode(ativa_LM35, OUTPUT);    
  pinMode(portaAnalogica, INPUT);
  pinMode(sensor_PIR, INPUT);
}

void loop() {
  if (digitalRead(sensor_PIR) == HIGH) {
    VerificaConexoesWiFIEMQTT();
    atividade_on();
  }    
  else {
    atividade_off();
    }
  delay(1000);                                // Aguarda por 5 segundos para nova leitura do PIR
}

void atividade_on() {                         // Existem pessoas no ambiente
  digitalWrite(LED_BUILTIN, LOW);             // Acende o LED interno (invertido no Node)
  digitalWrite(ativa_LDR, HIGH);              // Apaga o LED interno (invertido no Node)
  luminosidade = analogRead(portaAnalogica);
  digitalWrite(ativa_LDR, LOW);
  digitalWrite(ativa_LM35, HIGH);
  milivolts = (analogRead(portaAnalogica) / 1024.0) * 3300; //3300 milivolts - tensao entregue pelo NodeMCU
  temperatura = milivolts / 10;
  digitalWrite(ativa_LM35, LOW);
  
  // Monta JSON -----------------------------------------------------------------------
  StaticJsonBuffer<300> JSONbuffer;
  JsonObject& JSONencoder = JSONbuffer.createObject();
  
  char JSONmessageBuffer[100];

  JSONencoder["local"] = "Lab-6116";
  JSONencoder["temp"] = floorf(temperatura * 100) / 100; //Converte a temperatura para duas casas decimais
  JSONencoder["lumi"] = luminosidade;
  JSONencoder.printTo(JSONmessageBuffer, sizeof(JSONmessageBuffer));
  //------------------------------------------------------------------------------------
  Serial.println(JSONmessageBuffer);

  //garante funcionamento das conexões WiFi e ao broker MQTT
  VerificaConexoesWiFIEMQTT();
  
  MQTT.publish(TOPICO_PUBLISH,JSONmessageBuffer);
  delay(1000);

  //keep-alive da comunicação com broker MQTT
  MQTT.loop();
}

void atividade_off() {                      // Não existem pessoas no ambiente
  digitalWrite(LED_BUILTIN, HIGH);          // Apaga o Led da Placa
}

// Inicializa comunicação serial com baudrate 115200 (para fins de monitorar no terminal serial o que está acontecendo.
void initSerial()
{
  Serial.begin(115200);
}

// Inicializa e conecta-se na rede WI-FI desejada
void initWiFi()
{
  delay(10);
  Serial.println("------Conexao WI-FI------");
  Serial.print("Conectando na rede: ");
  Serial.println(SSID);
  Serial.print("Aguarde");

  reconectWiFi();
}

// Inicializa parâmetros de conexão MQTT(endereço do broker, porta e seta função de callback)
void initMQTT()
{
  MQTT.setServer(BROKER_MQTT, BROKER_PORT);    //informa qual broker e porta deve ser conectado
  //    MQTT.setCallback(mqtt_callback);            //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

// Função de callback chamada toda vez que uma informação de um dos tópicos subescritos chega)
//void mqtt_callback(char* topic, byte* payload, unsigned int length)
//{
//    String msg;
//
//    //obtem a string do payload recebido
//    for(int i = 0; i < length; i++)
//    {
//       char c = (char)payload[i];
//       msg += c;
//    }
//
//    //toma ação dependendo da string recebida:
//    //verifica se deve colocar nivel alto de tensão na saída D0:
//    //IMPORTANTE: o Led já contido na placa é acionado com lógica invertida (ou seja,
//    //enviar HIGH para o output faz o Led apagar / enviar LOW faz o Led acender)
//    if (msg.equals("L"))
//    {
//        digitalWrite(D0, LOW);
//        EstadoSaida = '1';
//    }
//
//    //verifica se deve colocar nivel alto de tensão na saída D0:
//    if (msg.equals("D"))
//    {
//        digitalWrite(D0, HIGH);
//        EstadoSaida = '0';
//    }
//
//}

// Reconecta-se ao broker MQTT (caso ainda não esteja conectado ou em caso de a conexão cair) em caso de sucesso na conexão ou reconexão, o subscribe dos tópicos é refeito.
void reconnectMQTT()
{
  while (!MQTT.connected())
  {
    Serial.print("* Tentando se conectar ao Broker MQTT: ");
    Serial.println(BROKER_MQTT);
    if (MQTT.connect(ID_MQTT, mqttUser, mqttPassword))
    {
      Serial.println("Conectado com sucesso ao broker MQTT!");
      MQTT.subscribe(TOPICO_SUBSCRIBE);
    }
    else
    {
      Serial.print("Falha ao reconectar no broker Status:");
      Serial.println(client.state());
      Serial.println("Tentando reconectar...");
      delay(2000);
    }
  }
}

// Reconecta-se ao WiFi
void reconectWiFi()
{
  //se já está conectado a rede WI-FI, nada é feito.
  //Caso contrário, são efetuadas tentativas de conexão
  if (WiFi.status() == WL_CONNECTED)
    return;

  WiFi.begin(SSID, PASSWORD); // Conecta na rede WI-FI

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(100);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Conectado com sucesso na rede ");
  Serial.print(SSID);
  Serial.print(" IP obtido: ");
  Serial.println(WiFi.localIP());
}

//Verifica o estado das conexões WiFI e ao broker MQTT.
void VerificaConexoesWiFIEMQTT(void)
{
  if (!MQTT.connected())
    reconnectMQTT();    //se não há conexão com o Broker, a conexão é refeita
    reconectWiFi();     //se não há conexão com o WiFI, a conexão é refeita
}



