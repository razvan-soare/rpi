"use strict";

const phychips = require('phychips-rcp');
const pr9200reader = require('./dist');

let reader = new pr9200reader.Pr9200Reader('COM4', {
  // baudRate: 115200,
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "none"
});

reader.on('ready', () => {
  console.log('Reader Connected');
  // stopAutoRead2: [Function: stopAutoRead2],
  // setPowerMode: [Function: setPowerMode],
  // setAntiCollisionMode: [Function: setAntiCollisionMode],
  // getAntiCollisionMode: [Function: getAntiCollisionMode],
  // getTypeCSelectParameter: [Function: getTypeCSelectParameter],
  // getTypeCQueryParameter: [Function: getTypeCQueryParameter],
  // getRegistryItem: [Function: getRegistryItem],
  // getReaderInformationModel: [Function: getReaderInformationModel],
  // getReaderInformationFWVersion: [Function: getReaderInformationFWVersion],
  // getReaderInformationManufacturer: [Function: getReaderInformationManufacturer],
  // getReaderInformationDetail: [Function: getReaderInformationDetail],
  // getReaderInformation: [Function: getReaderInformation],
  // getRegion: [Function: getRegion],
  // getCurrentRFChannel: [Function: getCurrentRFChannel],
  // getTemperature: [Function: getTemperature] }

  const taglist = {};
  setInterval(() => {

    reader.writeCommand(phychips.ReaderControlProtocol.startAutoRead2())
      .then((packet) => {
        console.log(packet);
        packet.forEach(pkt => {
          const newPkt = Array.from(pkt).map(p => Number(p).toString(16));
          const joinedPacket = Array.from(newPkt).join(" ");
          if (taglist[joinedPacket] && taglist[joinedPacket] !== 'undefined') {
            taglist[joinedPacket] = taglist[joinedPacket] + 1;
          } else {
            taglist[joinedPacket] = 1;
          }
        })
        Object.keys(taglist).forEach(tagkey => {
          console.log(`Read ${tagkey} = ${taglist[tagkey]} times.`)
        })
      });
  }, 1000);
});

reader.on('epc', (packet) => {
  console.log(packet);
});