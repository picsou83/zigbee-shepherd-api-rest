# zigbee-shepherd-api-rest

Use [zigbee-shepherd](https://github.com/zigbeer/zigbee-shepherd) since REST API. 

with CC2531 USB Dongle

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

### Projet en cours !!! work in progress !!!


Pour case 'devChange' et case 'attReport', les rapports sont logger et envoyé au plugin jeedom

Quelques exemples en attendant swagger :

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


