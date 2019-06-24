"use strict";
var __extends = (this && this.__extends) || (function () {
  var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var command_item_1 = require("./command-item");
var events_1 = require("events");
var SerialPort = require("serialport");
var Q = require("q");
var Pr9200Reader = /** @class */ (function (_super) {
  __extends(Pr9200Reader, _super);
  function Pr9200Reader(path, options) {
    var _this = _super.call(this) || this;
    _this.busy = false;
    _this.queue = [];

    _this.port = new SerialPort(path, options);

    _this.port.on('open', function () {
      console.log('opened')
      _this.portOpen();
    });
    _this.port.on('close', function () {
      _this.portClosed();
    });
    _this.port.on('data', function (data) {
      _this.portMultiData(data);
      // _this.portSingleData(data);
    });
    return _this;
  }
  Pr9200Reader.getInstance = function (path, options) {
    var exists = false;
    var elementIndex = -1;
    for (var index = 0; index < Pr9200Reader.instances.length; index++) {
      var element = Pr9200Reader.instances[index];
      if (element.port.path === path) {
        exists = true;
        elementIndex = index;
        break;
      }
    }
    if (!exists) {
      Pr9200Reader.instances.push(new Pr9200Reader(path, options));
      elementIndex = Pr9200Reader.instances.length - 1;
    }
    return Pr9200Reader.instances[elementIndex];
  };
  Pr9200Reader.prototype.open = function () {
    if (!this.port.isOpen) {
      this.port.open();
    }
  };
  Pr9200Reader.prototype.isOpen = function () {
    return this.port.isOpen;
  };
  Pr9200Reader.prototype.close = function () {
    if (this.port.isOpen) {
      this.port.close();
    }
  };
  Pr9200Reader.prototype.writeCommand = function (packet, callback) {
    var deferred = Q.defer();
    this.queue.push(new command_item_1.CommandItem(packet, deferred));
    if (!this.busy) {
      this.busy = true;
      this.processQueue();
    }
    return deferred.promise;
  };

  Pr9200Reader.prototype.processQueue = function () {
    // remove first element of the queue array
    var next = this.queue.shift();

    if (!next || next === 'undefined') {
      this.busy = false;
      this.current = undefined;
      return;
    }
    this.current = next;

    const checkSum = (buffer) => {
      let i, sum = 0;
      for (i = 0; i < buffer.length; i++) {
        sum = sum + buffer[i];
      }
      sum = 256 - sum % 256;
      return Number(sum).toString(16);
    }

    // Check command should have checksum 88
    // const checkCommand = [0xCC, 0x02, 0x01, 0xB1, 0x22, 0x04, 0xBB, 0x12, 0x02, 0x03];
    // const command = [0xBB, 0x00, 0x36, 0x00, 0x05, 0x02, 0x00, 0x00, 0x00, 0x64, 0x7E];
    const singleTag = [0x7C, 0xFF, 0xFF, 0x10, 0x32, 0x0C];
    const multiTag = [0x7C, 0xFF, 0xFF, 0x11, 0x32, 0x0C];

    const mainCommand = multiTag;

    mainCommand.push(`0x${checkSum(mainCommand)}`);

    // console.log('mainCommand', Buffer.from(mainCommand))
    this.port.write(Buffer.from(mainCommand));

  };
  Pr9200Reader.prototype.portOpen = function () {
    this.emit('ready');
  };
  Pr9200Reader.prototype.portClosed = function () {
    this.emit('finished');
  };

  let responseMultiQueue = Buffer.from([]);
  Pr9200Reader.prototype.portMultiData = function (data) {
    // Getting response from the port and concat
    responseMultiQueue = Buffer.concat([responseMultiQueue, data], responseMultiQueue.length + data.length);
    
    // If the first char in queue is not head(CC) then remove everything before next head
    if (responseMultiQueue[0] !== 204) {
      responseMultiQueue = Buffer.from(responseMultiQueue.subarray(0, responseMultiQueue.length));
    }

    // If we did not receive the return value yet we wait
    if (responseMultiQueue.length < 5) return;

    // Get the return value
    const returnValue = responseMultiQueue[4];
    if (returnValue === 0) {
      // 00 = success
      // If we did not receive tag id length we just wait
      if (responseMultiQueue.length < 6) return;
      // if it succeeds we get the length of the response and return it as a package
      const responseCount = responseMultiQueue[5];
      const responseLenght = responseMultiQueue[6];
      if (responseMultiQueue.length < 7 + responseLenght * responseCount) return;

      const newPacket = [];
      for (let i = 0; i < responseCount; i++) {
        newPacket.push(
          responseMultiQueue.subarray(7 + responseLenght * i, 7 + responseLenght * i + responseLenght)
        )
      }
     
      this.current.promise.resolve(newPacket);
      responseMultiQueue = responseMultiQueue.subarray(1, responseMultiQueue.length);
      this.processQueue();
      return;
    } else if (returnValue === 1) {
      // 01 = fail
      // if it fails make another request
      this.processQueue();
      // Remove the first header char so we can read the next tag
      responseMultiQueue = responseMultiQueue.subarray(1, responseMultiQueue.length);
      return;
    } else {
      // Something on happened
      this.processQueue();
      // Remove the first header char so we can read the next tag
      responseQueue = responseQueue.subarray(1, responseQueue.length)
      return;
    }
  }

  let responseQueue = Buffer.from([]);
  Pr9200Reader.prototype.portSingleData = function (data) {
    // Getting response from the port and concat
    responseQueue = Buffer.concat([responseQueue, data], responseQueue.length + data.length);
    // Get the position of the first header (char CC)
    const head = responseQueue.findIndex(r => r === 204);
    // Get the subarray starting from the head to the end
    const response = Buffer.from(responseQueue.subarray(head, responseQueue.length));
    // If the first char in queue is not head then remove everything before next head
    if (responseQueue[0] !== 204) {
      responseQueue = Buffer.from(responseQueue.subarray(head, responseQueue.length));
    }

    // If we did not receive the return value yet we wait
    if (response.length < 5) return;
    // Get the return value
    const returnValue = response[4];

    if (returnValue === 0) {
      // 00 = success
      // If we did not receive tag id length we just wait
      if (response.length < 6) return;
      // if it succeeds we get the length of the response and return it as a package
      const responseLenght = response[5];
      if (response.length < 6 + responseLenght) return;

      const newPacket = Buffer.from(response.subarray(6, 7 + responseLenght));
      this.current.promise.resolve(newPacket);
      responseQueue = responseQueue.subarray(1, responseQueue.length);
      this.processQueue();
      return;
    } else if (returnValue === 1) {
      // 01 = fail
      // if it fails make another request
      this.processQueue();
      // Remove the first header char so we can read the next tag
      responseQueue = responseQueue.subarray(1, responseQueue.length);

      return;
    } else {
      // Something on happened
      this.processQueue();
      // Remove the first header char so we can read the next tag
      responseQueue = responseQueue.subarray(1, responseQueue.length)
      return;
    }
  };

  Pr9200Reader.instances = [];
  return Pr9200Reader;
}(events_1.EventEmitter));
exports.Pr9200Reader = Pr9200Reader;
