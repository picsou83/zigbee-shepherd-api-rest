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
const Queue = require('queue');
var chalk = require('chalk');
var bodyParser = require('body-parser')
rest.use(bodyParser.json());
const deviceMapping = require('zigbee-shepherd-converters');
//const zclId = require('zcl-id');
const safeJsonStringify = require(__dirname + '/lib/json');
const statesMapping = require(__dirname + '/lib/devstates');
const SerialPort = require('serialport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

rest.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const timeOut = 255; //Connection timeout is disabled if value is set to 255
const listenPort = 3000;
	    this.queue = new Queue();
        this.queue.concurrency = 1;
        this.queue.autostart = true;


setLeaveMsg();


/************************/
/* Event handle         */
/************************/




zserver.on('ready', function () {
	    zserver.permitJoin(timeOut);
     
});

zserver.on('permitJoining', function (joinTimeLeft) {
	console.log(chalk.green('[ permitJoining ] ') + joinTimeLeft + ' sec');
});


zserver.on('error', function (err) {
	errorInd(err.message);
});


zserver.on('ind', function (msg) {
	
	        switch (msg.type) {
     
            case 'attReport':
            case 'devChange': {
		console.log(chalk.green('[ Report & Change ] ') 
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
//		console.log('"' + jeedomchangegenOnOff + '" converted to Base64 is "' + base64data + '"'); 
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
			console.log(chalk.green('[ CMD ] ') 
				+ ' ' + msg.type 
				+ ' ' + msg.endpoints[0].device.type 
				+ ' ieeeAddr ' + msg.endpoints[0].device.ieeeAddr 
				+ ' nwkAddr ' + msg.endpoints[0].device.nwkAddr 
				+ ' manufName ' + msg.endpoints[0].device.manufName 
				+ ' manufId ' + msg.endpoints[0].device.manufId 
				+ ' powerSource ' + msg.endpoints[0].device.powerSource 
				+ ' modelId ' + msg.endpoints[0].device.modelId 
				+ ' clusterid ' + msg.data.cid);
										
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
        break;

	case 'devStatus':
	devStatusInd(msg.endpoints[0].getIeeeAddr(), msg.data);
        break;

        case 'devInterview':
	console.log(chalk.red('[ devInterview ] ') + JSON.stringify(msg.data) + ' interview!');
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

function errorInd (msg) {
    console.log(chalk.red('[ error ] ') + msg);
}

function devIncomingInd (dev) {
    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.permAddr);
}

function devStatusInd (permAddr, status) {
    status = (status === 'online') ? chalk.green(status) : chalk.red(status);
    console.log(chalk.magenta('[ devStatus ] ') + '@' + permAddr + ', ' + status);
}

function attrsChangeInd (permAddr, gad) {
   console.log(chalk.blue('[   attrsChange ] ') + '@' + permAddr + ', auxId: ' + gad.auxId + ', value: ' + gad.value);
}

function attrsreportInd (permAddr, gad) {
    console.log(chalk.blue('[   attrsChange ] ') + '@' + permAddr + ', auxId: ' + gad.auxId + ', value: ' + gad.value);
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
var zbPart1 = chalk.blue('      ____   ____ _____ ___   ____ ____        ____ __ __ ____ ___   __ __ ____ ___   ___     '),
    zbPart2 = chalk.blue('     /_  /  /  _// ___// _ ) / __// __/ ____  / __// // // __// _ \\ / // // __// _ \\ / _ \\ '),
    zbPart3 = chalk.blue('      / /_ _/ / / (_ // _  |/ _/ / _/  /___/ _\\ \\ / _  // _/ / ___// _  // _/ / , _// // /  '),
    zbPart4 = chalk.blue('     /___//___/ \\___//____//___//___/       /___//_//_//___//_/   /_//_//___//_/|_|/____/    ');

    console.log('');
    console.log('');
    console.log('Welcome to zigbee-shepherd webapp... ');
    console.log('');
    console.log(zbPart1);
    console.log(zbPart2);
    console.log(zbPart3);
    console.log(zbPart4);
    console.log(chalk.gray('         A network server and manager for the ZigBee machine network'));
    console.log('');
    console.log('   >>> Author:     Jack Wu (jackchased@gmail.com)              ');
    console.log('   >>> Version:    zigbee-shepherd v0.2.0                      ');
    console.log('   >>> Document:   https://github.com/zigbeer/zigbee-shepherd  ');
    console.log('   >>> Copyright (c) 2016 Jack Wu, The MIT License (MIT)       ');
    console.log('');
    console.log('The server is up and running, press Ctrl+C to stop server.     ');
    console.log('---------------------------------------------------------------');
}

/**********************************/
/* goodBye function               */
/**********************************/
function setLeaveMsg() {
    process.stdin.resume();

    function showLeaveMessage() {
        console.log(' ');
        console.log(chalk.blue('      _____              __      __                  '));
        console.log(chalk.blue('     / ___/ __  ___  ___/ /____ / /  __ __ ___       '));
        console.log(chalk.blue('    / (_ // _ \\/ _ \\/ _  //___// _ \\/ // // -_)   '));
        console.log(chalk.blue('    \\___/ \\___/\\___/\\_,_/     /_.__/\\_, / \\__/ '));
        console.log(chalk.blue('                                   /___/             '));
        console.log(' ');
        console.log('    >>> This is a simple demonstration of how the shepherd works.');
        console.log('    >>> Please visit the link to know more about this project:   ');
        console.log('    >>>   ' + chalk.yellow('https://github.com/zigbeer/zigbee-shepherd'));
        console.log(' ');
        process.exit();
    }

    process.on('SIGINT', showLeaveMessage);
}




/**********************************/
/* Indication function iobroker   */
/**********************************/

   
function onReady() {

 
    // get and list all registered devices
    let activeDevices = getAllClients();
    activeDevices.forEach(device => {
		configureDevice(device);
		if ((device.manufId === 4151) || (device.manufId === 4447)) {
                zserver.find(device.ieeeAddr, device.epList[0]).getDevice().update({
                     status: 'online',
                     joinTime: Math.floor(Date.now() / 1000),
                });
            }
    });
}

function errorInd (msg) {
    console.log('[ error ] ' + msg);
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

function  handleInterval() {
        zserver.getAllClients()
            .filter((d) => d.type === 'Router') // Filter routers
            .filter((d) => d.powerSource && d.powerSource !== 'Battery') // Remove battery powered devices
            .forEach((d) => zserver.ping(d.ieeeAddr)); // Ping devices.
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

/**********************************/
/* start shepherd                 */
/**********************************/
zserver.start((error) => {
            if (error) {
                console.log('Error while starting zigbee-shepherd, attemping to fix... (takes 60 seconds)');
                
                setTimeout(() => {
                    console.log(`Starting zigbee-shepherd`);
                    zserver.start((error) => {
                        if (error) {
                            console.log('Error while starting zigbee-shepherd!');
                            console.log(
                                'Press the reset button on the stick (the one closest to the USB) and start again'
                            );
                            } else {
									showWelcomeMsg();
									zserver.emit('ready');
									zserver.controller.request('UTIL', 'ledControl', {ledid: 3, mode: 0});
							}
                    });
                }, 60000);
            } else {
									showWelcomeMsg();
									zserver.emit('ready');
									zserver.controller.request('UTIL', 'ledControl', {ledid: 3, mode: 0});
            }
        });


/**********************************/
/* app web avec express           */
/**********************************/

this.queue.push((queueCallback) => {
rest.get('/genOnOff', function(req, res){
	var appareil = req.query.appareil;
	var commande = req.query.commande;
	var epid = req.query.epid;
	var ep = zserver.find(appareil, + epid);
	console.log(chalk.white('[ getcommmand ] ') + ' commande ' + commande + ' pour ' + appareil);
	ep.functional('genOnOff', commande, {}, function (err) {
            if(!err){
                res.send(true);
                queueCallback();
            }else{
                res.send(false);
                queueCallback();
 	    }
	});
});
});

rest.get('/epdump', function(req, res){
	var appareil = req.query.appareil;
	var commande = req.query.commande;
	var device2 = zserver._findDevByAddr(appareil);
    var resultat = device2.dump();
       	console.log('Reception GET request ' + JSON.stringify(resultat));
            if(!err){
				res.send(JSON.parse(resultat));
            }else{
                res.send(false);
	    }
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
	console.log(chalk.white('[ getbindcoordinatorep1 ] ') + appareil);
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
	console.log(chalk.white('[ getbindshepherd ] ') + appareil1 + '  ' + ep1 + ' with ' + appareil2 + '  ' + ep2 );
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
	console.log(chalk.white('[ getbindgroup ] ') + ieeeAddr + '  ' + epId + ' with ' + group );
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
	console.log(chalk.white('[ getbindgroup ] ') + ieeeAddr + '  ' + epId + ' with ' + group );
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
rest.get('/functionnal', function(req, res){
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

rest.get('/bindtest', function(req, res){
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



rest.get('/bind', function(req, res){
	var cmd = req.query.cmd;
	var vnwaddr = req.query.vnwaddr;
	var vieeaddr = req.query.vieeaddr;
	var vepid = req.query.vepid;
	var clusid = req.query.clusid;
	var dstmode = req.query.dstmode;
	var dstaddr = req.query.dstaddr;
	var dstepid = req.query.dstepid;

//	console.log('Reception GET simpleDescReq ' + parametre);
	zserver.controller.request('ZDO', cmd, { dstaddr: + vnwaddr, srcaddr: vieeaddr, srcendpoint: + vepid, clusterid: + clusid, dstaddrmode: + dstmode, addr_short_long: dstaddr, dstendpoint: + dstepid }, function (err) {
		        if (!err) {
				res.send(true);
                }else{
			    res.send(false);
			}
});
});

//http://192.168.1.56:3000/bind?command=bindReq&vnwaddr=30413&vieeaddr=0x000d6ffffe7cc1e8&vepid=1&clusid=6&dstmode=3&dstaddr=0x00124b0018ecde4f&dstepid=1
// { dstaddr: 30413, srcaddr: '0x000d6ffffe7cc1e8', srcendpoint: 1, clusterid: 6, dstaddrmode: 3, addr_short_long: '0x00124b0018ecde4f', dstendpoint: 1 } 


/**********************************/
/* ZShepherd AF Command           */
/**********************************/

//pour 2 http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=24593&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x01

//http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&transid=75&options=48&radius=30&len=3&data1=0x01&data2=0x4a&data3=0x01    	
//http://192.168.1.56:3000/af?cmd=dataRequestExt&dstaddrmode=2&dstpanid=0&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x01    	


rest.get('/af', function(req, res){
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
            transid: + transid,
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

/**********************************/
/* ZShepherd ZDO Command           */
/**********************************/

rest.get('/zdo', function(req, res){
	var cmd = req.query.cmd;
	var tags = req.query.tags;
	var group = req.query.group;
	var groupname = req.query.groupname;
	var dstaddr = req.query.dstaddr;
	var nwkaddrofinterest = req.query.nwkaddrofinterest;
	var endpoint = req.query.endpoint;
	var namelen = req.query.namelen;
	var transid = req.query.transid;
	var options = req.query.options;
	var radius = req.query.radius;
	var relaycount = req.query.relaycount;  
	var relaylist = req.query.relaylist;
	var len = req.query.len;
	var data1 = req.query.data1;
	var data2 = req.query.data2;
	var data3 = req.query.data3;	
	
	if (cmd == 'powerDescReq') {
	var zcldata = {
            dstaddr: tag1,
            nwkaddrofinterest: tag2,
        };
	} else if (cmd == 'simpleDescReq') {
		var zcldata = {
            dstaddr: dstaddr,
            nwkaddrofinterest: nwkaddrofinterest,
            endpoint: + endpoint
        };
	} else if (cmd == 'extAddGroup') {
		var zcldata = {
            endpoint: + endpoint,
            groupid: + group,
            namelen: + namelen,
            groupname: + groupname
          };
	} else if ((cmd == 'extRemoveGroup') || (cmd == 'extFindGroup')) {
		var zcldata = {
            endpoint: + endpoint,
            groupid: + group     
        };
	} else if ((cmd == 'extRemoveAllGroup') || (cmd == 'extFindAllGroupsEndpoint')) {
		var zcldata = {
            endpoint: + endpoint,
        };
	} else if (cmd == 'extCountAllGroups') {
		var zcldata = { };
	} else if (cmd == 'sendData') {
		var zcldata = {
            shortaddr: + dstaddr,
            transseq: + transid,
			cmd: + tags,
            len: + len,
            buf: ([+ data1, + data2, + data3])
        };
	} 
//http://192.168.1.56:3000/zdo?cmd=sendData&dstaddr=10&commnd=dataRequest&len=3&data1=0x01&data2=0x4a&data3=0x01
	
		
	
console.log('zdo with ' + cmd + ' and ' + JSON.stringify(zcldata));
	
zserver.controller.request('ZDO', cmd, zcldata, function (err, data) {
					if (!err) {
						console.log(data);
						res.json(data);
					} else {
						console.log(err);
						res.send(err);
					}
	});

});

//http://192.168.1.56:3000/af?cmd=dataRequestExt&dstaddrmode=1&dstpanid=0&dstaddr=0x000000000000000a&destendpoint=1&srcendpoint=1&clusterid=6&len=3&data1=0x01&data2=0x4a&data3=0x00

    
//Initialisation du listener pour recevoir les requêtes POSTs et GETs
rest.listen(listenPort);
