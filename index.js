module.exports = function(RED) {
  'use strict';

  function igniteMetrics(n) {
    

    RED.nodes.createNode(this, n);
    
    let require = this.context().global.get('require');
    var appmetrics = require('appmetrics')
    var node = this;

    node.on("input",function(msg) {
      node.send(msg);
    });
   
    this.interval_id = null;
    this.monitor = appmetrics.monitor();
    this.selectedEvents = n.events.split(',');

    

    var logGroupA = [];
    var logGroupB = [];
    var logSwitchAB = true;

    function pushLog(type, data){
      if(type == "node" && (data.type == "ignite metrics" || data.type == "debug"))
      {
          return;
      }
      if(logSwitchAB)
      {
        logGroupA.push({ "type" : type, value : data  })
      }
      else{
        logGroupB.push({ "type" : type, value : data  })
      }
    }

    this.selectedEvents.forEach(element => {
          node["_monitor" + element] = function(data){

            pushLog(element, data);
          }
          this.monitor.on(element, node["_monitor" + element]);
      });
      function sendlog(log){
        if(log && log.length > 0){
            node.emit('input', {payload : log });
        }
      }
      this.interval_id = setInterval(function(e){
            logSwitchAB = !logSwitchAB;
            if(logSwitchAB){
              sendlog(logGroupB);
              logGroupB = [];
            }
            else
            {
              sendlog(logGroupA);
              logGroupA = [];
            }
          },n.delay? n.delay * 1000 : 5000);
          
          

  }
  
  RED.nodes.registerType('ignite metrics', igniteMetrics);

  igniteMetrics.prototype.close = function() 
  {
      this.selectedEvents.forEach(element => {
        this.monitor.off(element, this["_monitor" + element]);
      });

      if (this.interval_id != null) {
          clearInterval(this.interval_id);
      } 
      if(this.monitor != null){
        delete this.monitor;
      }
  };
};
