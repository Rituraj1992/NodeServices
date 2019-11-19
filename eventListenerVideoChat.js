var redis = require("redis");
// var s=require("string");
var readConfig = require('read-config');
var redisConf = readConfig('/var/www/html/node_services/redis.json');
var request = require('request');

redisClient=redis.createClient(redisConf.primary.port,redisConf.primary.server,{socket_keepalive:true});

redisClient.on('connect',function(){
	// if(typeof(redisConf.primary.auth)!="undefined"){
	if((typeof(redisConf.auth)!="undefined") && (redisConf.auth == "1")){
		redisClient.auth(redisConf.primary.password);
	}
	lpopQueue();
	//-----ON SUCCESSFUL CONNECTION TO REDIS WE CALL RECURSIVE FUNCTION FOR POPING DATA FROM REDIS QUEUE 
});

var callAPI=function (api_type,data){
	var req_url = data;		//for CZ VideoChat
	console.log("req_url", req_url);
	request.post(req_url, (error, res, body) => {
		if (error) {
			console.error(error)
			return
		}
		console.log(`statusCode: ${res.statusCode}`)
		console.log("body============="+body);
	});
}
//--------Main Function for fetching data from queue & pushing it to Omni-zen-comm
var lpopQueue = function(source) {
	//  console.log(isConnected);
	redisClient.lpop("enablex_notification",function(err,data){
		//------If no data found in queue function will stop for 5 seconds & check again after 10 seconds 
		if(data==null){
			setTimeout(function(){
				lpopQueue();
			},5000)
		}
		//------If data Exist write it on omni-zen-comm & call self for fetching more data 
		else{
			//lastPacket=data;
			callAPI("upload",data);
			lpopQueue();
		}
	});
};

redisClient.on('error',function(err){
	console.log(err);
});
