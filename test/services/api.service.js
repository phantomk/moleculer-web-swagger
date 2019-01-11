const {
	ServiceBroker
} = require("moleculer");
const ApiService = require("moleculer-web");
const swaggerService = require("../../index");

const broker = new ServiceBroker();

// // Load API Gateway
// broker.createService(ApiService);

broker.createService({
	mixins: [swaggerService],

	settings: {
		routes: [{
      "path": "/charge",
      "aliases": {
        "POST create": async function(req, res) {
          // ...
        },
        "POST create2"(req, res) {
          // ...
        },
        "GET retrieve": async function(req, res) {
          // ...
        }
      },
      bodyParsers: {
        json: true,
        urlencoded: { extended: true }
      },
      whitelist: [
        // Access to any actions in all services under "/member" URL
        "**"
      ]
		}]
	}
});

// Start server
broker.start();
