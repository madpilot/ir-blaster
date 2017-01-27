var logger = require('winston');
var express = require('express')
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

function HttpInput(config) {
  this.config = config;
  this.bind = config.bind || "0.0.0.0";
  this.port = config.port || 80;

  this.apiKey = config.apiKey;
}

function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
}

function returnError(req, res, error) {
  logger.error("[HTTP Input] " + req.method + " " + req.url + " " + error);
  res.status(500);
  res.send(JSON.stringify({ error: error }));
}

function authenticate(config) {
  return function(req, res, next) {
    var authorization = req.get('Authorization');

    if(authorization == "Bearer " + config.apiKey) {
      next();
    } else {
      logger.error("[HTTP Input] Forbidden");
      res.status(403);
      res.send({ status: "Forbidden" });
    }
  }
}

HttpInput.prototype.listen = function(handler) {
  var context = this;

  if(this.config.apiKey) {
    app.use(authenticate(this.config));
  }

  app.get("/devices", function(req, res) {
    handler(null, null, null, function(error, ids) {
      setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify(ids));
      }
    });
  });

  app.get("/list/:device/", function(req, res) {
    handler(req.params.device, "list", null, function(error, keys) {
      setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify(keys));
      }
    });
  });

  app.put("/send/:device", function(req, res) {
    handler(req.params.device, "sendOnce", req.body.key, function(error, success) {
      setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify({ status: "OK" }));
      }
    });
  });

  app.put("/start/:device", function(req, res) {
    handler(req.params.device, "sendStart", req.body.key, function(error, success) {
      setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify({ status: "OK" }));
      }
    });
  });

  app.put("/stop/:device", function(req, res) {
    handler(req.params.device, "sendStop", req.body.key, function(error, success) {
     setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify({ status: "OK" }));
      }
    });
  });

  app.get("/status/:device", function(req, res) {
    handler(req.params.device, "status", req.params.key, function(error, status) {
     setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify(status));
      }
    });
  });

  app.get("/statuses/:device", function(req, res) {
    handler(req.params.device, "statuses", null, function(error, statuses) {
      setHeaders(res);
      if(error != null) {
        returnError(req, res, error);
      } else {
        res.send(JSON.stringify(statuses));
      }
    });
  });

  app.listen(this.port, function() {
    logger.info("[HTTP Input] Listening on " + context.bind + ":" + context.port);
  });
}

module.exports = HttpInput;
