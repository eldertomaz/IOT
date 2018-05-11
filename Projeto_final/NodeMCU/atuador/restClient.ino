#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
 
const char* ssid = "IoT";
const char* password = "12345678";
 
void setup () {
 
  Serial.begin(115200);
  WiFi.begin(ssid, password);
 
  while (WiFi.status() != WL_CONNECTED) {
 
    delay(1000);
    Serial.print("Connecting..");
 
  }
}
 
void loop() {
 
  if (WiFi.status() == WL_CONNECTED) { //Check WiFi connection status

    Serial.println("----POST----");
    
    StaticJsonBuffer<300> JSONbuffer;   //Declaring static JSON buffer
    JsonObject& JSONencoder = JSONbuffer.createObject(); 
 
    //JSONencoder["valor"] = "24";  //leitura do sensor
    
    char JSONmessageBuffer[300];
    JSONencoder.prettyPrintTo(JSONmessageBuffer, sizeof(JSONmessageBuffer));
    Serial.println(JSONmessageBuffer);
 
    HTTPClient http;  //Declare an object of class HTTPClient
    
    http.begin("http://35.198.8.16:3000/atuador");      //Specify request destination
    http.addHeader("Content-Type", "application/json");  //Specify content-type header

    int httpCode = http.POST(JSONmessageBuffer);   //Send the request
    String payload = http.getString();   
    
    if (httpCode > 0) { //Check the returning code
      Serial.print("Response Code: ");
      Serial.println(httpCode);
      String payload = http.getString();   //Get the request response payload
      Serial.println(payload);            //Print the response payload
 
    }

    Serial.println("----GET----");
    http.begin("http://35.198.8.16:3000/atuador/recente");  //Specify request destination
    httpCode = http.GET();                                                                  //Send the request

    if (httpCode > 0) { //Check the returning code
      Serial.print("Response Code: ");
      Serial.println(httpCode);
      String payload = http.getString();   //Get the request response payload      
      payload.remove(0, 1);
      
      Serial.println(payload);             //Print the response payload

      // Parsing
      const size_t bufferSize = JSON_OBJECT_SIZE(2) + JSON_OBJECT_SIZE(3) + JSON_OBJECT_SIZE(5) + JSON_OBJECT_SIZE(8) + 370;
      DynamicJsonBuffer jsonBuffer(bufferSize);
      JsonObject& root = jsonBuffer.parseObject(payload);
      // Parameters
      int id = root["_id"]; 
      const char* time = root["time"]; 
      const char* valor = root["valor"]; 
 
      Serial.print("id:");
      Serial.println(id);
      Serial.print("Time:");
      Serial.println(time);
      Serial.print("valor:");
      Serial.println(valor);
    }
    http.end();   //Close connection
  }
  delay(5000);    //Send a request every 30 seconds
}
