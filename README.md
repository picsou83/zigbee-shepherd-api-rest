### Projet en cours !!! work in progress !!!
WARNING i'm not a developer but it works

I only use get request to interact with zigbee shepherd

# zigbee-shepherd-api-rest

Use [zigbee-shepherd](https://github.com/zigbeer/zigbee-shepherd) since REST API and swagger-ui-express  

with CC2531 USB Dongle

WARNING currently swagger-ui-express is not implemented

### To run the demo

* Install
```  
git clone https://github.com/picsou83/zigbee-shepherd-api-rest.git
npm install  
```

* Run the WebApp
```
node server.js 
```

* if you already have a database with zigbee-shepherd
copy database in /data/
change parameters in server.js it must be the same as the old configuration
WARNING the key can change panid and lose all those objects

```
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
```

* pairing device

https://koenkk.github.io/zigbee2mqtt/getting_started/pairing_devices.html

use configuration to bind end report device (use zigbee-shepherd-converters)

http://192.168.1.56:3000/configuration?appareil=0x000d6ffffe7cc1e8

* Open up http://youripofservernodejs:3000/api-docs with your browser

use swagger

* Use API directly with your browser http://youripofservernodejs:3000/


Commande ON
```
http://192.168.1.56:3000/genOnOff?appareil=0x000d6ffffe7c311c&epid=1&commande=on
```

Commande OFF
```
http://192.168.1.56:3000/genOnOff?appareil=0x000d6ffffe7c311c&epid=1&commande=off
```


<br />

## Additional info

There is a [friendly project](https://github.com/koenkk/zigbee2mqtt) with similar functionality on the same technologies, where you can work with the same devices using the MQTT protocol.

There are knowledge bases that can be useful for working with Zigbee-devices and equipment:
* in English https://github.com/koenkk/zigbee2mqtt/wiki
* in Russian https://github.com/kirovilya/ioBroker.zigbee/wiki

## Zigbee adapter for Xiaomi (and other) devices via cc2531/cc2530

With the Zigbee-coordinator based on Texas Instruments SoC cc253x (and others), it creates its own zigbee-network, into which zigbee-devices are connected. By work directly with the coordinator, the driver allows you to manage devices without additional gateways / bridge from device manufacturers (Xiaomi / TRADFRI / Hue). About the device Zigbee-network can be read [here (in English)](https://github.com/Koenkk/zigbee2mqtt/wiki/ZigBee-network).

## Hardware

For work, you need one of the following devices, flashed with a special ZNP firmware: [cc2531, cc2530, cc2530 + RF](https://github.com/Koenkk/zigbee2mqtt/wiki/Supported-sniffer-devices#zigbee-coordinator)

<span><img src="https://ae01.alicdn.com/kf/HTB1Httue3vD8KJjSsplq6yIEFXaJ/Wireless-Zigbee-CC2531-Sniffer-Bare-Board-Packet-Protocol-Analyzer-Module-USB-Interface-Dongle-Capture-Packet.jpg_640x640.jpg" width="100"></span>
<span><img src="http://img.dxcdn.com/productimages/sku_429478_2.jpg" width="100"></span>
<span><img src="http://img.dxcdn.com/productimages/sku_429601_2.jpg" width="100"></span>
<span><img src="https://ae01.alicdn.com/kf/HTB1zAA5QVXXXXahapXXq6xXFXXXu/RF-TO-USB-CC2530-CC2591-RF-switch-USB-transparent-serial-data-transmission-equipment.jpg_640x640.jpg" width="100"></span>

The necessary equipment for the firmware and the device preparation process are described [here (in English)](https://github.com/Koenkk/zigbee2mqtt/wiki/Getting-started) or [here (in Russian)](https://github.com/kirovilya/ioBroker.zigbee/wiki/%D0%9F%D1%80%D0%BE%D1%88%D0%B8%D0%B2%D0%BA%D0%B0)

The devices connected to the Zigbee-network and inform the coordinator of their status and events (button presses, motion detection, temperature change). This information is reflected in console.log and export to jeedom plugin but it's possible to export object-states elsewhere.

## the reports are logger and sent to the jeedom plugin
'devChange' and 'attReport' are sent to jeedom plugin
example of Get request :
```
{"Type":"attReport","Typedev":"Router","ieeeAddr":"0xd0cf5efffeb423d2","nwkAddr":44829,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 W opal 1000lm","epId":1,"data":{"cid":"genOnOff","data":{"onOff":0}}}
```

it's possible to import this events elsewhere with nodejs or php ect ...

```  
  	let buff = new Buffer(data, 'base64');
    let text = buff.toString('ascii');  
  	let valeur = null;
  	console.log('"' + data + '" converted from Base64 to ASCII is "' + text + '"');
```

## Some examples while waiting swagger

Lancer bind + report en utilisant zigbee-shepherd-converters:
http://192.168.1.56:3000/configuration?appareil=0x000d6ffffe7cc1e8

list([ieeeAddrs])
Lists the information of devices managed by shepherd. The argument accepts a single ieee address or an array of ieee addresses, and the output will always be an array of the corresponding records. All device records will be listed out if ieeeAddrs is not given.
http://192.168.1.56:3000/list

info()
Returns shepherd information.

http://192.168.1.56:3000/info

lancer une commande on/off

http://192.168.1.56:3000/genOnOff?appareil=0x000d6ffffe7c311c&epid=1&commande=on

lancer une commande on/off via af

http://192.168.1.56:3000/af?cmd=dataRequest&dstaddr=5222&destendpoint=1&srcendpoint=1&clusterid=6&transid=75&options=48&radius=30&len=3&data1=0x01&data2=0x4a&data3=0x01  

ajouter un group à un end device :

http://192.168.1.56:3000/functionnal?ieeeAddr=0x000d6ffffea4efc6&epId=1&cId=genGroups&cmd=add&group=10&groupname=group10

create group on coordinator (example 12) :

http://192.168.1.56:3000/zdo?cmd=extAddGroup&endpoint=1&group=12&groupname=group12
{"status":0}

it's possible to verify with zdo command extFindGroup

http://192.168.1.56:3000/zdo?cmd=extFindGroup&endpoint=1&group=12&groupname=group12
{"status":0,"groupid":12,"namelen":0,"groupname":{"type":"Buffer","data":[]}}

and bind on off switch with group 12 but warning the button can be linked to a single group at a time
for me unbind with group 11 and bind with group 12

http://192.168.1.56:3000/unbindgroup?ieeeAddr=0x000d6ffffe105c0a&epId=1&group=11

bind end device with group

http://192.168.1.56:3000/bindgroup?ieeeAddr=0x000d6ffffe105c0a&epId=1&group=12


