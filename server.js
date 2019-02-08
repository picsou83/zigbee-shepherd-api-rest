'use strict';

var ZShepherd = require('zigbee-shepherd');
var zserver = new ZShepherd('/dev/ttyACM0', {
	sp: {
	     baudRate: 115200, 
	     rtscts: true
	    },
	dbPath: (__dirname + '/data/database.db'),
	net: {
	        panId: 0x1111,
	        channelList: [ 12 ],    // pick CH12 and CH14
	        precfgkey: [ 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
	                     0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f ],
	        precfgkeysEnable: true
	     }
});

//REST api library
var express = require('express');
var rest = express();
var request = require('request');
var bodyParser = require('body-parser')
rest.use(bodyParser.json());

const deviceMapping = require('zigbee-shepherd-converters');
const zclId = require('zcl-id');
const SerialPort = require('serialport');

//swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
rest.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Vars
const timeOut = 255; //Connection timeout is disabled if value is set to 255
const listenPort = 3000;

/**
* Setup command queue.
* The command queue ensures that only 1 command is executed at a time.
* When executing multiple commands at the same time, some commands may fail.
*/
const Queue = require('queue');
this.queue = new Queue();
this.queue.concurrency = 1;
setTimeout(() => {
this.queue.autostart = true;
this.queue.start();
}, 3000);

/************************/
/* Event handle         */
/************************/

zserver.on('ready', function () {
	    zserver.permitJoin(timeOut);
	    setTimeout(function () {
		zserver.controller.request('UTIL', 'ledControl', {ledid: 3, mode: 0});
		}, 50000);
});

//zserver.controller.on('ZDO:endDeviceAnnceInd', function (data) {
//		if(!data.ieeeaddr){
//        return
//        }
//    var device = this.getShepherd()._findDevByAddr(data.ieeeaddr);
//    console.log('update nwkaddr ' + data.nwkaddr);
//        device.update({ nwkAddr: data.nwkaddr });
//		zserver._devbox.maintain(function (err){ });
	
        
//    zserver.controller.request('AF', 'dataRequest', { dstaddr: data.nwkaddr, destendpoint: 1, srcendpoint: 1, clusterid: 0, transid: 31, options: 48, radius: 30, len: 9, data: new Buffer([ 0, 1, 0, 4, 0, 5, 0, 7, 0]) }, function (err, rsp) {

//	var ep = zserver.find(data.ieeeaddr, 1);

//	ep.foundation('genBasic', 'read', [ { attrId: 5 } ], function (err, rsp) {

 //   if (!err){
//		console.log(rsp);
//		console.log('string' + JSON.stringify(rsp));
//	       var obj = JSON.parse(JSON.stringify(rsp));
//        console.log(obj[0].attrData);
//		var manufacturerName = obj[0].attrData;
//			var modelId = obj[0].attrData;
//		var powersource = obj[1].attrData;
//			console.log(' modelId ' + modelId );
//	        device.update({ modelId: modelId, incomplete: false });
//			zserver._devbox.maintain(function (err){ });
//			configureDevice(device);
 //	           }
//	});

//});

zserver.on('permitJoining', function (joinTimeLeft) {
	console.log('[ permitJoining ] ' + joinTimeLeft + ' sec');
});

zserver.on('error', function (err) {
    console.log(err);
});

zserver.controller.on('SAPI:findDeviceConfirm', function (data) {
		if(!data.result){
        return
        }
    var dev = zserver._findDevByAddr(data.result);
    if (!dev) {
		return
		} else {
	console.log('update du status 205 en Online pour ' + data.result);
	dev.update({ nwkAddr: data.searchkey, status: 'online' });
	zserver._devbox.sync(dev._getId(), function () {});
}
});

zserver.on('ind', function (msg) {
	
	        switch (msg.type) {
				
				
			case 'dataConfirm':
//			console.log('[ dataConfirm ] ' + JSON.stringify(msg.data) + ' ' + JSON.stringify(msg.cId));
			 break;
            case 'attReport':
            case 'devChange': {
				console.log('[ Report & Change ] ' 
					+ ' ' + msg.type 
					+ ' ' + msg.endpoints[0].device.type 
					+ ' ieeeAddr ' + msg.endpoints[0].device.ieeeAddr 
					+ ' nwkAddr ' + msg.endpoints[0].device.nwkAddr 
					+ ' manufId ' + msg.endpoints[0].device.manufId 
					+ ' manufName ' + msg.endpoints[0].device.manufName 
					+ ' powerSource ' + msg.endpoints[0].device.powerSource 
					+ ' modelId ' + msg.endpoints[0].device.modelId 
					+ ' data ' + JSON.stringify(msg.data));	

				var jeedomchange = JSON.stringify({
										Type: msg.type,
										Typedev: msg.endpoints[0].device.type,
										ieeeAddr: msg.endpoints[0].device.ieeeAddr,
										nwkAddr: msg.endpoints[0].device.nwkAddr,
										manufId: msg.endpoints[0].device.manufId,
										manufName: msg.endpoints[0].device.manufName,
										powerSource: msg.endpoints[0].device.powerSource,
										modelId: msg.endpoints[0].device.modelId,
										epId: msg.endpoints[0].epId,
										data: msg.data,
									});
									
				var buff = new Buffer(jeedomchange);  
				var base64data = buff.toString('base64');
//			console.log('"' + jeedomchangegenOnOff + '" converted to Base64 is "' + base64data + '"'); 
				var urljeedomchange = 'http://192.168.1.54:8122/'+base64data;
				request(urljeedomchange, function (error, response, body) {
                if (error) { console.log("--- Error send request http report & Change:", error); }
              });
			}
            break;

          
            case 'cmdOn':
            case 'cmdOff':
            case 'cmdOffWithEffect':
            case 'cmdStep':
            case 'cmdStop':
            case 'cmdStepColorTemp':
            case 'cmdMoveWithOnOff':
            case 'cmdMove':
            case 'cmdMoveHue':
            case 'cmdMoveToSaturation':
            case 'cmdStopWithOnOff':
            case 'cmdMoveToLevelWithOnOff':
            case 'cmdToggle':
            case 'cmdTradfriArrowSingle':
            case 'cmdTradfriArrowHold':
            case 'cmdTradfriArrowRelease':
            case 'cmdStepWithOnOff': {
				console.log('[ CMD ] ' 
										+ ' ' + msg.type 
										+ ' ' + msg.endpoints[0].device.type 
										+ ' ieeeAddr ' + msg.endpoints[0].device.ieeeAddr 
										+ ' nwkAddr ' + msg.endpoints[0].device.nwkAddr 
										+ ' manufName ' + msg.endpoints[0].device.manufName 
										+ ' manufId ' + msg.endpoints[0].device.manufId 
										+ ' powerSource ' + msg.endpoints[0].device.powerSource 
										+ ' modelId ' + msg.endpoints[0].device.modelId 
										+ ' clusterid ' + msg.data.cid 
										+ ' groupid ' + msg.groupid 
										+ ' linkquality ' + msg.linkquality);
										
				var jeedom = JSON.stringify({
					Type: msg.type,
					Typedev: msg.endpoints[0].device.type,
					ieeeAddr: msg.endpoints[0].device.ieeeAddr,
					nwkAddr: msg.endpoints[0].device.nwkAddr,
					manufId: msg.endpoints[0].device.manufId,
					manufName: msg.endpoints[0].device.manufName,
					powerSource: msg.endpoints[0].device.powerSource,
					modelId: msg.endpoints[0].device.modelId,
					epId: msg.endpoints[0].epId,
					data: msg.data,
					clusterid: msg.data.cid,
					groupid: msg.groupid,
					linkquality: msg.linkquality,
				});
												
				var buff = new Buffer(jeedom);  
				var base64 = buff.toString('base64');
				var urljeedom = 'http://192.168.1.54:8122/'+base64;
				request(urljeedom, function (error, response, body) {
                if (error) { console.log("--- Error send request http CMD:", error); }
              });
            }
            break;
			
			
			case 'devIncoming':
				devIncomingInd(getDevInfo(msg.data, msg.endpoints));
				var device = zserver._findDevByAddr(msg.data);
				if (!device) {
				return
				}
				configureDevice(device);
            break;

			case 'devStatus':
				devStatusInd(msg.endpoints[0].getIeeeAddr(), msg.data);
        break;

            case 'devInterview':
				console.log('[ devInterview ] ' + JSON.stringify(msg.data) + ' interview!');
            break;
                
            case 'devLeaving':
                leavingDevice(msg);
            break;
               
            default:
                console.log('Type de callback non definit! > ' + msg.type);
            break;
        }
    });


/**********************************/
/* Indication function demo       */
/**********************************/

function devIncomingInd (dev) {
    console.log('[   devIncoming ] ' + '@' + dev.permAddr);
}

function devStatusInd (permAddr, status) {
    status = (status === 'online') ? status : status;
    console.log('[ devStatus ] ' + '@' + permAddr + ', ' + status);
}

function leavingDevice(msg) {
    console.log('device ' + msg.data + ' leaving the network!');
}

 function getDevice(ieeeAddr) {
   return getDevices().find((d) => d.ieeeAddr === ieeeAddr);
}

function  getDevices() {
   return zserver.list();
}


/**********************************/
/* welcome function               */
/**********************************/
function showWelcomeMsg() {
var zbPart1 = '      ____   ____ _____ ___   ____ ____        ____ __ __ ____ ___   __ __ ____ ___   ___     ',
    zbPart2 = '     /_  /  /  _// ___// _ ) / __// __/ ____  / __// // // __// _ \\ / // // __// _ \\ / _ \\ ',
    zbPart3 = '      / /_ _/ / / (_ // _  |/ _/ / _/  /___/ _\\ \\ / _  // _/ / ___// _  // _/ / , _// // /  ',
    zbPart4 = '     /___//___/ \\___//____//___//___/       /___//_//_//___//_/   /_//_//___//_/|_|/____/    ';

    console.log('');
    console.log('');
    console.log('Welcome to zigbee-shepherd webapp... ');
    console.log(' ');
    console.log(zbPart1);
    console.log(zbPart2);
    console.log(zbPart3);
    console.log(zbPart4);
    console.log(' ');
    console.log('         A network server and manager for the ZigBee machine network');
    console.log(' ');
    console.log('The server is up and running, press Ctrl+C to stop server.     ');
    console.log('---------------------------------------------------------------');
}

/**********************************/
/* goodBye function               */
/**********************************/
function showLeaveMessage() {
        console.log(' ');
        console.log('      _____              __      __                  ');
        console.log('     / ___/ __  ___  ___/ /____ / /  __ __ ___       ');
        console.log('    / (_ // _ \\/ _ \\/ _  //___// _ \\/ // // -_)   ');
        console.log('    \\___/ \\___/\\___/\\_,_/     /_.__/\\_, / \\__/ ');
        console.log('                                   /___/             ');
        console.log(' ');
}

/**********************************/
/* Indication function iobroker   */
/**********************************/

   
function onReady() {
    // get and list all registered devices
    let activeDevices = getAllClients();
    activeDevices.forEach(device => {
		configureDevice(device);
		if ((device.manufId === 4151) || (device.manufId === 4447 || 4476)) {
                zserver.find(device.ieeeAddr, device.epList[0]).getDevice().update({
                     status: 'online',
                     joinTime: Math.floor(Date.now() / 1000),
                });
            }
    });
}


function pingall2() {
    // get and list all registered devices
	const devices = getAllClients();
        devices.forEach((device) => {
            if ((device.manufId === 4151) || (device.manufId === 4447) || (device.manufId === 4476)) {
//            .forEach((d) => this.ping(d.ieeeAddr)); // Ping devices.  
	console.log('for ' + device.ieeeAddr + ' status ' + device.status);
    }
});
}

   
function pingall() {
    // get and list all registered devices
    let activeDevices = getAllClients()
    .filter((d) => d.type === 'Router') // Filter routers

    activeDevices.forEach(function(device, index) {
//            .forEach((d) => this.ping(d.ieeeAddr)); // Ping devices.  
    setTimeout(function () {  
		console.log('ping ' + device.ieeeAddr + ' status ' + device.status);
     	ping(device.ieeeAddr);
            		}, 20000 * (index + 1));
      
    });

}

function ping(deviceID) {
        const device = zserver._findDevByAddr(deviceID);
        const ieeeAddr = device.ieeeAddr;
        if (device) {
            console.log('Check online' + ieeeAddr);
            zserver.controller.checkOnline(device);
        }
}

function ping2(deviceID) {
            zserver.controller.checkOnline2();
  }     
    

function getDevices() {
        return zserver.list();
}

function configureDevice(device) {
    // Configure reporting for this device.
    var ieeeAddr = device.ieeeAddr;
    if (ieeeAddr && device.modelId) {
        var mappedModel = deviceMapping.findByZigbeeModel(device.modelId);

        if (mappedModel && mappedModel.configure) {
            mappedModel.configure(ieeeAddr, zserver, getCoordinator(), (ok, msg) => {
                if (ok) {
                    console.log(`Succesfully configured ${ieeeAddr}`);
                } else {
                    console.log(`Failed to configure ${ieeeAddr} ` + device.modelId);
                }
            });
        }
    }
}

function getCoordinator() {
        const device = zserver.list().find((d) => d.type === 'Coordinator');
        return zserver.find(device.ieeeAddr, 1);
}

function info (message, data) {
        console.log('info', message, data);
}

 function getAllClients() {
        return zserver.list().filter((device) => device.type !== 'Coordinator');
}

function getDevInfo (ieeeAddr, eps) {
    var dev = {
            permAddr: ieeeAddr,
            status: zserver.list(ieeeAddr)[0].status,
            gads: {}
        };

    return dev;
}

function removeDevice(deviceID, callback) {
        zserver.remove(deviceID, (error) => {
            if (error) {
                console.log(`Failed to remove '${deviceID}', trying force remove...`);
                forceRemove(deviceID, callback);
            } else {
                callback(null);
            }
        });
}

function forceRemove(deviceID, callback) {
        const device = zserver._findDevByAddr(deviceID);

        if (device) {
            return zserver._unregisterDev(device, (error) => callback(error));
        } else {
            console.log(`Could not find ${deviceID} for force removal`);
            callback(true);
        }
}

/**********************************/
/* start shepherd                 */
/**********************************/
zserver.start((err) => {
	showWelcomeMsg();
	if (err) {
    console.log('Error while starting zigbee-shepherd, attemping to fix... (takes 60 seconds)');
    setTimeout(() => {
		console.log(`Starting zigbee-shepherd`);
        zserver.start((error) => {
			if (error) {
            console.log('Error while starting zigbee-shepherd!', error);
            } else {
              console.log('zigbee-shepherd started');
            }
                    });
    }, 60 * 1000);
    } else {
    console.log('zigbee-shepherd started!');
    }
});

/**********************************/
/* start queue push               */
/**********************************/
this.queue.push((queueCallback) => {

const timeoutqueue = 170;

/**********************************/
/* app web avec express           */
/**********************************/
// Créé directement les pages HTML à partir de templates pug 
//rest.set('views', __dirname + '/data/views');
//rest.set('view engine', 'pug');

//rest.get('/', function(req, res) {
//  res.render('index')
//});

//var baseUrl = "http://192.168.1.21";

//rest.use('/tabmesures.json', function (req, res, next) {
//  request({url: baseUrl + '/tabmesures.json',timeout:2000}, function (error, response, body) {
//    if (!error && response.statusCode == 200) {
//      console.log("tabmesures receptionnées depuis l'ESP8666" + body) 
//      res.send(body);
//    } else {
//      console.log("ESP8666 muet, envoi du jeu de données test")
//      res.send([{"mesure":"Température","valeur":"21.60","unite":"°C","glyph":"glyphicon-indent-left","precedente":"19.80"},{"mesure":"Humidité","valeur":"29.80","unite":"%","glyph":"glyphicon-tint","precedente":"30.40"},{"mesure":"Pression Atmosphérique","valeur":"984.51","unite":"mbar","glyph":"glyphicon-dashboard","precedente":"984.74"}]);
//    }
//  })
//});


rest.get('/genOnOff', function(req, res){
	var appareil = req.query.appareil;
	var commande = req.query.commande;
	var epid = req.query.epid;
	var ep = zserver.find(appareil, + epid);
	console.log('[ getcommmand ] ' + ' commande ' + commande + ' pour ' + appareil);
	ep.functional('genOnOff', commande, {}, function (err) {
            if(!err){
                res.send(true);
            }else{
                res.send(false);
 	    }
	});
setTimeout(() => queueCallback(), timeoutqueue);
});




rest.get('/read', function(req, res){
	var appareil = req.query.appareil;
	var commande = req.query.commande;
	var epid = req.query.epid;
	var ep = zserver.find(appareil, + epid);
	console.log('[ getcommmand ] ' + ' commande ' + commande + ' pour ' + appareil);
	ep.read('genOnOff', 'onOff', function (err, data) {
            if(!err){
				console.log(data);
                res.send(true);
            }else{
                res.send(false);
 	    }
	});
setTimeout(() => queueCallback(), timeoutqueue);  
});

rest.get('/readbasic', function(req, res){
	var appareil = req.query.appareil;
	var epid = req.query.epid;
	var ep = zserver.find(appareil, + epid);
	console.log('[ getcommmand ] ' + ' pour ' + appareil);
	ep.foundation('genBasic', 'read', [ { attrId: 5 }, { attrId: 7 } ], function (err, rsp) {
    if (!err){
        console.log(rsp);
	res.send(rsp);
            }else{
                res.send(false);
 	    }
	});
setTimeout(() => queueCallback(), timeoutqueue);  
});



rest.get('/epdump', function(req, res){
	var appareil = req.query.appareil;
	var device2 = zserver._findDevByAddr(appareil);
  	if (!device2) {
      res.send(false);
    }
    var resultat = device2.dump();
    console.log('Reception GET request ' + JSON.stringify(resultat));
    res.send(JSON.stringify(resultat));
	setTimeout(() => queueCallback(), timeoutqueue);
	});

rest.get('/mgmtLqiReq', function(req, res){
	var vnwaddr = req.param('vnwaddr');
	zserver.controller.request('ZDO', 'mgmtLqiReq', { dstaddr: vnwaddr, startindex: 0 }, function (err) {
                if (!err) {
				res.send(true);
                }else{
				res.send(false);
			}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

rest.get('/mgmtRtgReq', function(req, res){
	var vnwaddr = req.param('vnwaddr');
	zserver.controller.request('ZDO', 'mgmtRtgReq', { dstaddr: vnwaddr, startindex: 0 }, function (err) {
                if (!err) {
				res.send(true);
                }else{
				res.send(false);
			}
});
setTimeout(() => queueCallback(), timeoutqueue);
});


rest.get('/mgmtNwkUpdateReq', function(req, res){
	console.log('Reception POST request');
	var vnwaddr = req.param('vnwaddr');
	zserver.controller.request('ZDO', 'mgmtNwkUpdateReq', { dstaddr: vnwaddr, dstaddrmode: 2 , channelmask: 4096 , scanduration: 14 , scancount: 10 , nwkmanageraddr: 0 });
	       	
            if(!err){
                res.send(true);
            }else{
                res.send(false);
	    }
setTimeout(() => queueCallback(), timeoutqueue);
});   



rest.get('/testdiscover', function(req, res){
	console.log('Reception POST request');
	var vnwaddr = req.param('vnwaddr');
	zserver.controller.request('ZDO', 'mgmtNwkDiscReq', { dstaddr: vnwaddr, scanchannels: 4096 , scanduration: 14 , startindex: 0 });
	       	
            if(!err){
                res.send(true);
            }else{
                res.send(false);
	    }
});   

rest.get('/bindcoordinatorep1', function(req, res){
	const foundationCfg = {manufSpec: 0, disDefaultRsp: 0};
    const cfg = {direction: 0, attrId: 0, dataType: 16, minRepIntval: 0, maxRepIntval: 1000, repChange: 0};
    var coordinator = zserver.find('0x00124b0018ecde4f', 1);
	var appareil = req.param('appareil');
	var ep = zserver.find(appareil, 1);
	console.log('[ getbindcoordinatorep1 ] ' + appareil);
	ep.bind('genOnOff', coordinator, function (err) {
            if(!err){
				console.log('Successfully bind ' + appareil + ' to coordinator!');
                res.send(true);
                ep.foundation('genOnOff', 'configReport', [cfg], foundationCfg, function (err, rsp) {
    if (!err)
        console.log('Successfully report ' + rsp + ' to coordinator!');
});
            }else{
                res.send(false);
	    }
	});
setTimeout(() => queueCallback(), timeoutqueue);
});  



	

//AF:dataRequest, { dstaddr: 6878, destendpoint: 1, srcendpoint: 1, clusterid: 6, transid: 233, options: 48, radius: 30, len: 5, data: <Buffer 00 e9 00 fd ff> } 

// cc-znp:SREQ --> AF:dataRequest, { dstaddr: 5222, destendpoint: 1, srcendpoint: 1, clusterid: 6, transid: 75, options: 48, radius: 30, len: 3, data: <Buffer 01 4a 01> } +3ms
// on prise ch cc-znp:SREQ --> AF:dataRequest, { dstaddr: 5222, destendpoint: 1, srcendpoint: 1, clusterid: 6, transid: 184, options: 48, radius: 30, len: 3, data: <Buffer 01 b8 01> } 
//off AF:dataRequest, { dstaddr: 5222, destendpoint: 1, srcendpoint: 1, clusterid: 6, transid: 236, options: 48, radius: 30, len: 3, data: <Buffer 01 ec 00> } +7ms
//(srcEp, addrMode, dstAddrOrGrpId, cId, rawPayload, opt, callback

rest.get('/bindep', function(req, res){
//http://192.168.1.56:3000/bindshepherd?appareil1=0x000d6ffffe7cc1e8&ep1=1&appareil2=0x00124b0018ecde4f&ep2=1
	var appareil1 = req.query.appareil1;
	var appareil2 = req.query.appareil2;
	var ep1 = req.query.ep1;
	var ep2 = req.query.ep2;
	var device1 = zserver.find(appareil1, + ep1);
	var device2 = zserver.find(appareil2, + ep2);
	console.log('[ getbindshepherd ] ' + appareil1 + '  ' + ep1 + ' with ' + appareil2 + '  ' + ep2 );
	device1.bind('genOnOff', device2, function (err) {
            if(!err){
				console.log('Successfully bind ' + appareil1 + '  ' + ep1 + ' with ' + appareil2 + '  ' + ep2);
                res.send(true);
            }else{
                res.send(false);
	    }
	});
});   

//http://192.168.1.56:3000/bindgroup?ieeeAddr=0x000d6ffffe105c0a&epId=1&group=11

rest.get('/bindgroup', function(req, res){
//http://192.168.1.56:3000/bindgroup?ieeeAddr=0x000d6ffffe105c0a&epId=1&group=11
	var ieeeAddr = req.query.ieeeAddr;
	var epId = req.query.epId;
	var group = req.query.group;
	var device = zserver.find(ieeeAddr, + epId);
	console.log('[ getbindgroup ] ' + ieeeAddr + '  ' + epId + ' with ' + group );
	device.bind('genOnOff', + group, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
						console.log(err);
						res.send(err);
					}
	});
});  

rest.get('/unbindgroup', function(req, res){
//http://192.168.1.56:3000/bindgroup?ieeeAddr=0x000d6ffffe105c0a&epId=1&group=11
	var ieeeAddr = req.query.ieeeAddr;
	var epId = req.query.epId;
	var group = req.query.group;
	var device = zserver.find(ieeeAddr, + epId);
	console.log('[ getbindgroup ] ' + ieeeAddr + '  ' + epId + ' with ' + group );
	device.unbind('genOnOff', + group, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
						console.log(err);
						res.send(err);
					}
	});
});  


//[ getbindgroup ] 0x000d6ffffe105c0a  1 with 11
//cc-znp:SREQ --> ZDO:bindReq, { dstaddr: 0xca39, srcaddr: 0xd6ffffe105c0a, srcendpoint: 1, clusterid: 6, dstaddrmode: 1, addr_short_long: '0x000000000000000b', dstendpoint: 255 } +1ms


rest.get('/configuration', function(req, res){
	var appareil = req.query.appareil;

	var device = getDevice(appareil);
	
    var ieeeAddr = device.ieeeAddr;
    if (ieeeAddr && device.modelId) {
        var mappedModel = deviceMapping.findByZigbeeModel(device.modelId);

        if (mappedModel && mappedModel.configure) {
            mappedModel.configure(ieeeAddr, zserver, getCoordinator(), (ok, msg) => {
                if (ok) {
                    console.log(`Succesfully configured ${ieeeAddr}`);
                    res.send(true);
                } else {
                    console.log(`Failed to configure ${ieeeAddr} ` + device.modelId);
                    res.send(false);
                }
            });
        }
    }
 
});

/**********************************/
/* ZShepherd ClassAPI            */
/**********************************/

rest.get('/permitJoin', function(req, res){
	var time = req.query.time;
	zserver.permitJoin(+ time, 'all', function (err) {
		if (!err){
			console.log('ZNP is now allowing devices to join the network for ' + time + ' seconds.');
			res.send('ZNP is now allowing devices to join the network for ' + time + ' seconds.');
		}else{
				console.log(err);
                res.send(false);
	    }
	});
});


rest.get('/reset', function(req, res){
	var mode = req.query.mode;
	zserver.reset(mode, function (err) {
		if (!err){
			console.log('soft reset successfully.');
			res.send('soft reset successfully.');
		}else{
				console.log(err);
                res.send(false);
	    }
	});
});

rest.get('/info', function(req, res){
	var resultat = zserver.info();
		console.log('GET request info' + JSON.stringify(resultat));
		res.json(resultat);
});



rest.get('/list', function(req, res){
	var ieeeAddr = req.query.ieeeAddr;
		var resultat = zserver.list(ieeeAddr);
		console.log('GET request list' + JSON.stringify(resultat));
		res.json(resultat);
});

rest.get('/lqi', function(req, res){
	var ieeeAddr = req.query.ieeeAddr;
    zserver.lqi(ieeeAddr, function (err, data) {
			if (!err) {
				console.log('GET request lqi' + JSON.stringify(data));
				res.json(data);
			} else {
				console.log(' GET request lqi => Error: device is not found.');
                res.send(false);
			}
	});
});

rest.get('/remove', function (req, res){
	var ieeeAddr = req.query.ieeeAddr;
	zserver.remove(ieeeAddr, function (err) {
			if (!err){
				console.log('Successfully removed! ' + ieeeAddr);
				res.send('Successfully removed! ' + ieeeAddr);
			}else{
				console.log('GET request remove => Error: device is not found.');
				res.send(false);
			}
	});
});


/**********************************/
/* ZShepherd Endpoint Class       */
/**********************************/

rest.post('/functionnal/:cid/:cmd', function(req, res) {
var resultat = req.body;  
  
console.log('Get Request ' + req.params.cmd + ' of ' + req.params.cid + ' for ' + req.query.ieeeAddr + ' with ' + req.query.epId + ' ' + JSON.stringify(resultat));
  
  	var ep = zserver.find(req.query.ieeeAddr, + req.query.epId);
  	if (!req.query.epId) {
            console.log('Please add epId number example : epId=1');
            res.send('Please add epId number example : epId=1');
            return;
        }
				ep.functional( req.params.cid, req.params.cmd, resultat, function (err, data) {
					if (!err) {
                     const parson = JSON.parse(JSON.stringify(data))
                     if (parson.statusCode) {
						var result = zclId.status(parson.statusCode);
						console.log(result);
						res.json(result);
                    } else {
                      	console.log(data);
                        res.send('data' + JSON.stringify(data) + 'parson' + JSON.stringify(parson));
						return;
					}
				} else {   
					console.log(err);
					res.send(err);
					}
				});
});

rest.get('/getSimpleDesc', function(req, res){
	var ieeeAddr = req.query.ieeeAddr;
	var epId = req.query.epId;
	var ep = zserver.find(ieeeAddr, + epId);
			if (!ep) {
				console.log(' GET request getSimpleDesc => Error: ieeeAddr or epId is not found.');
				res.send(false);
				return;
			} else {
				var resultat = ep.getSimpleDesc();
				console.log('Reception GET request ' + JSON.stringify(resultat));
                res.json(resultat);
            }

});	    

//http://192.168.1.56:3000/functionnal?ieeeAddr=0x000d6ffffea4efc6&epId=1&cId=genGroups&cmd=getMembership
rest.get('/functionnal2', function(req, res){
	var ieeeAddr = req.query.ieeeAddr;
	var epId = req.query.epId;
	var cId = req.query.cId;
	var cmd = req.query.cmd;
	if (!epId) {
            console.log('Please add epId number example : epId=1');
            res.send('Please add epId number example : epId=1');
            return;
        }
    var ep = zserver.find(ieeeAddr, + epId);
	    if (!ep) {
            console.log(`Failed to find device with ieeAddr: '${ieeeAddr}' and epId '${epId}'`);
            res.send(`Failed to find device with ieeAddr: '${ieeeAddr}' and epId '${epId}'`);
            return;
        }
        if (cId == 'genGroups' && cmd != undefined) {
			if (cmd == 'getMembership') {
				var groupcount = req.query.groupcount;
				var grouplist = req.query.grouplist;
				console.log(cmd + ' of ' + cId + ' for ' + ieeeAddr + ' with ' + epId + ' ' + groupcount + ' ' + grouplist);
				ep.functional('genGroups', cmd, { groupcount: + groupcount, grouplist: + grouplist }, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
					console.log(err);
					res.send(err);
					}
				});
			} else if (cmd == 'removeAll') {
				console.log(cmd + ' of ' + cId + ' for ' + ieeeAddr + ' with ' + epId);
				ep.functional('genGroups', cmd, { }, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
					console.log(err);
					res.send(err);
					}
				});
			
			} else	{
				var group = req.query.group;
				var groupname = req.query.groupname;
				console.log(cmd + ' of ' + cId + ' for ' + ieeeAddr + ' with ' + epId + ' ' + group + ' ' + groupname);
				ep.functional('genGroups', cmd, { groupid: + group, groupname: groupname }, function (err, data) {
					if (!err) {
						var parson = JSON.parse(JSON.stringify(data));
						if (!parson.statusCode) {
						var resultat = zclId.status(parson.status);
						console.log(resultat);
						res.json(resultat);
						} else {
						console.log(data);
						res.json(data);
						return;
						}
					} else {
						console.log(err);
                        res.send(err);
						return;
					}
				});
			}
				
		} else if (cId == 'genOnOff' && cmd != undefined) {
				console.log(cmd + ' of ' + cId + ' for ' + ieeeAddr + ' with ' + epId);
				ep.functional(cId, cmd, { }, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
					console.log(err);
					res.send(err);
					}
				});
					
		} else if (!cmd) {
            console.log('Please add command cmd cmd= view add remove removeAll');
            res.send('Please add command cmd cmd= view add remove removeAll');
            return;
        } else {
	        console.log('please add cluster cId=genGroups');
	        res.send('please add cluster cId=genGroups');
            return;
		}
			
			
});

rest.get('/getDeviceInfo', function(req, res){
	console.log('Reception POST request');
	zserver.controller.request('UTIL', 'getDeviceInfo', { });
	       	
            if(!err){
                res.send(true);
            }else{
                res.send(false);
	    }
});   

rest.get('/ping', function(req, res){
	console.log('Reception POST request');
	zserver.controller.request('SYS', 'ping', {}, function (err, result) {
    if (err) {
				console.log(err);
                res.send(false);
            }else{
				console.log(result); 
                res.send(false);
	    }
}); 
}); 

/**********************************/
/* ZShepherd AF Command           */
/**********************************/

//pour 2 http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=24593&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x01

//http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&transid=75&options=48&radius=30&len=3&data1=0x01&data2=0x4a&data3=0x01    	
//http://192.168.1.56:3000/af?cmd=dataRequestExt&dstaddrmode=2&dstpanid=0&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x01    	


rest.get('/getaf', function(req, res){
	var cmd = req.query.cmd;
	var dstaddrmode = req.query.dstaddrmode;
	var dstaddr = req.query.dstaddr;
	var destendpoint = req.query.destendpoint;
	var dstpanid = req.query.dstpanid;
	var srcendpoint = req.query.srcendpoint;
	var clusterid = req.query.clusterid;
	var transid = req.query.transid;
	var options = req.query.options;
	var radius = req.query.radius;
	var relaycount = req.query.relaycount;  
	var relaylist = req.query.relaylist;
	var len = req.query.len;
	var data1 = req.query.data1;
	var data2 = req.query.data2;
	var data3 = req.query.data3;	
	
	if (cmd == 'dataRequestExt') {
		var afParams = {
            dstaddrmode: dstaddrmode,
            dstaddr: dstaddr,
            destendpoint: + destendpoint,
            dstpanid: + dstpanid,
            srcendpoint: + srcendpoint,
            clusterid: + clusterid,
            transid: zserver.controller ? zserver.controller.nextTransId() : null,
            options: + options,
            radius: + radius,
            len: + len,
            data: ([+ data1, + data2, + data3])
        };
		
	} else if (cmd == 'dataRequest') {
		var afParams = {
            dstaddr: + dstaddr,
            destendpoint: + destendpoint,
            srcendpoint: + srcendpoint,
            clusterid: + clusterid,
            transid: zserver.controller ? zserver.controller.nextTransId() : null,
            transid: + transid,
            options: + options,
            radius: + radius,
            len: + len,
            data: ([+ data1, + data2, + data3])
        };
	} else if (cmd == 'dataRequestSrcRtg') {
//http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&transid=75&options=48&radius=30&relaycount=5&relalist=5&len=3&data1=0x01&data2=0x4a&data3=0x01
		var afParams = {
            dstaddr: + dstaddr,
            destendpoint: + destendpoint,
            srcendpoint: + srcendpoint,
            clusterid: + clusterid,
            transid: + transid,
            options: + options,
            radius: + radius,
            relaycount: + relaycount,
            relaylist: + relaylist,
            len: + len,
            data: ([+ data1, + data2, + data3])
        };
	}
	
	
	
	
console.log('Receive AF with ' + cmd + ' and ' + JSON.stringify(afParams));
zserver.controller.request('AF', cmd, afParams, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
					console.log(err);
					res.send(err);
					}
	});
});


rest.post('/af/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller._znp.request('AF', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

rest.post('/af2/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller.request('AF', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

/**********************************/
/* ZShepherd ZDO Command           */
/**********************************/

rest.post('/zdo/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller._znp.request('ZDO', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

rest.post('/zdo2/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller.request('ZDO', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

//curl -X POST "http://192.168.1.56:3000/name/mgmtLqiReq" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"dstaddr\":11072, \"startindex\":1}"

/**********************************/
/* ZShepherd SYS Command          */
/**********************************/

rest.post('/sys/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller._znp.request('SYS', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

rest.post('/sys2/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller.request('SYS', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

/**********************************/
/* ZShepherd UTIL Command         */
/**********************************/

rest.post('/util/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller._znp.request('UTIL', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

rest.post('/util2/:cmd', function(req, res) {
    //Récupération de la propriété name dans le body
    var resultat = req.body;
  	var cmd = req.params.cmd;
    
console.log('Get Request ' + JSON.stringify(resultat) + ' ' + cmd);
	
zserver.controller.request('UTIL', cmd, resultat, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
setTimeout(() => queueCallback(), timeoutqueue);
});

/**********************************/
/* ZShepherd Other Command        */
/**********************************/

rest.get('/online', function(req, res){
	var appareil = req.query.appareil;
	var dev = getDevice(appareil);
	var ieeeAddr = dev.ieeeAddr;
  	console.log('Receive GET request online for ' + appareil);
	if (dev && dev.status === 'online'){
        console.log('device already online');
      	res.send('device already online');
    } else {
     ping(ieeeAddr);
     res.send(true);
  	  }
});

rest.get('/online2', function(req, res){
	var appareil = req.query.appareil; //ieeeaddr 0x000d6ffffe105635
	var dev = zserver._findDevByAddr(appareil); 
  console.log('voici nwkaddr de dev' + dev.nwkAddr);
  
  zserver.controller.request('ZDO', 'ieeeAddrReq', { shortaddr: dev.nwkAddr, reqtype: 0, startindex: 1 }).timeout(10000).fail(function () {
        return zserver.controller.request('ZDO', 'ieeeAddrReq', { shortaddr: dev.nwkAddr, reqtype: 0, startindex: 1 }).timeout(10000);
    }).then(function () {
        if (dev.status === 'offline') {
             console.log('ok is offline donc lance on');
            dev.update({ status: 'online' });
              zserver._devbox.maintain(function (err){ });
            console.log('*************** Online for ' + appareil + ' **************************');
            res.send(true);
        }
    }).fail(function () {
        console.log('ok is fail');
        dev.update({ status: 'timeout' });
          zserver._devbox.maintain(function (err){ });
        console.log('*************** Offline for ' + appareil + ' **************************');
        res.send(false);
    }).done();

});

rest.get('/online3', function(req, res){
	var appareil = req.query.appareil;
	var dev = zserver._findDevByAddr(appareil);
//	dev.update({ status: 'online', incomplete: false });
	dev.update({ nwkAddr: 56328 });
  	console.log('Receive GET request online2 for ' + appareil);
  	 zserver._devbox.maintain(function (err){ });
     res.send(true);

});

rest.get('/pingall', function(req, res){
     pingall();
     res.send(true);

});

rest.get('/pingall2', function(req, res){
     pingall2();
     res.send(true);

});

rest.post('/pingall2', function(req, res){
     pingall2();
     res.send(true);
  
});

rest.get('/encoremoi', function(req, res){
		var appareil = req.query.appareil;
  
  	console.log('******************* commande test ******************* ');
	zserver.controller.request('ZDO', 'nodeDescReq', { dstaddr: + appareil, nwkaddrofinterest: + appareil }, function (err, result) {
					if (!err) {
						console.log(result);
						res.json(result);
					} else {
						console.log(err);
						res.send(err);
					}
});
});

rest.get('/debug', function(req, res){
  	console.log('******************* START DEBUG ******************* ');
	zserver.controller._znp.on('AREQ', function (msg) {
    console.log(msg);
	});
	zserver.controller._znp.on('SREQ', function (msg) {
    console.log(msg);
	});
	zserver.controller._znp.on('SRSP', function (msg) {
    console.log(msg);
	});
	zserver.controller._znp.on('POLL', function (msg) {
    console.log(msg);
	});
    res.send(true);
});    
 
rest.get('/kill', function(req, res){
  	console.log('******************* KILL DE NODEJS ******************* ');
    res.send(true);
	server.close(() => {
    console.log('Http server closed.');
	});
	showLeaveMessage();
    process.exit();
});  
  
rest.get('/upnwkaddr', function(req, res){
	
const devices = getAllClients();
	devices.forEach((device) => {
            if (device.ieeeAddr === '0x000d6ffffe105635') {
				console.log(device.ieeeAddr);
				zserver.find(device.ieeeAddr, device.epList[0]).getDevice().update({status: 'online'});
//				zserver.controller.emit('joining', { type: 'associating', ieeeAddr: '0x000d6ffffe105635', nwkAddr: 56328 });
                res.send(true);
            }
        });
});

//        dev.update({nwkAddr: data.nwkaddr})

/**********************************/
/* FIN QUEUE express		      */
/**********************************/
        
});
        
//http://192.168.1.56:3000/af?cmd=dataRequestExt&dstaddrmode=1&dstpanid=0&dstaddr=0x000000000000000a&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x00



/****************************************************************************/
/* Initialisation du listener pour recevoir les requêtes POSTs et GETs	    */
/****************************************************************************/
const server = rest.listen(listenPort, function onStart(err) {
  if (err) {
    console.log(err);
  } else {
  console.info('==> App Listening on port %s.', listenPort);
}
});

/************************/
/* Kill Process		    */
/************************/

process.on('SIGTERM', () => {
	console.info('SIGTERM signal received.');
    console.log('Closing http server.');
	server.close(() => {
    console.log('Http server closed.');
	});
	this.queue.stop();
	showLeaveMessage();
    process.exit();
 });
