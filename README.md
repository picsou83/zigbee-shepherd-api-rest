### Projet en cours !!! work in progress !!!
ATTENTION i'm not a developer but it works

# zigbee-shepherd-api-rest

Use [zigbee-shepherd](https://github.com/zigbeer/zigbee-shepherd) since REST API and swagger-ui-express  

with CC2531 USB Dongle

ATTENTION currently swagger-ui-express is not implemented

### To run the demo

* Install
```  
npm install  
```

* Run the WebApp
```
npm start  
```

* Open up http://0.0.0.0:3000/api-docs with your browser


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
'devChange' et case 'attReport'
it's possible to import events elsewhere with 

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


