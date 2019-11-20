/*
 * moleculer-web-swagger
 * Copyright (c) 2018 phantomk (https://github.com/phantomk)
 * MIT Licensed
 */

"use strict";
const _ = require("lodash");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const fastify = require("fastify");
const swaggerSpecification = require("./specification.json");

/**
 * Official API Gateway service for Moleculer
 */
module.exports = {

	// Service name
	name: "swagger",

	// Default settings
	settings: {
		// Middleware mode for ExpressJS
		middleware: false,

		// Exposed port
		port: process.env.PORT || 3002,

		// Exposed IP
    ip: process.env.IP || "0.0.0.0",

    // is Expose swagger
    expose: true,
    
    // Swagger Specification
    swagger: {},

		// Routes
		routes: []
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
    if (this.settings.expose === false) return;

    this.settings.swagger = Object.assign(swaggerSpecification, this.settings.swagger);

    this.server = fastify();
    this.server.register(require('fastify-static'), {
      root: path.join(__dirname, '../static'),
      prefix: '/', // optional: default '/'
    });
	},

	actions: {

	},

	methods: {
		/**
		 * Create route object from options
		 *
		 * @param {Object} opts
		 * @returns {Object}
		 */
		createSwagger(opts) {
      if (this.settings.swaggerCache) {
        return this.settings.swaggerCache;
      }

      let swaggerObject = swaggerSpecification

      // reset
      swaggerObject.tags = [];
      swaggerObject.paths = {};

      if (swaggerObject.info.title === '') {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
        swaggerObject.info.title = pkg.name;
      }

      for (let opt of opts) {
        Object.assign(swaggerObject.paths, this.createSwaggerPath(opt));
      }

      delete swaggerObject.consumes;
      delete swaggerObject.produces;
      this.settings.swaggerCache = swaggerObject;

			return swaggerObject;
    },
    
		createSwaggerPath(opts) {    
      this.logger.info(`add '${opts.path}' to swagger`);

      let route = {
				opts,
				middlewares: []
      };

			if (opts.authorization) {
				if (!_.isFunction(this.authorize)) {
					this.logger.warn("Define 'authorize' method in the service to enable authorization.");
					route.authorization = false;
				} else
					route.authorization = true;
			}
			if (opts.authentication) {
				if (!_.isFunction(this.authenticate)) {
					this.logger.warn("Define 'authenticate' method in the service to enable authentication.");
					route.authentication = false;
				} else
					route.authentication = true;
			}

			// Create URL prefix
			const globalPath = this.settings.path && this.settings.path != "/" ? this.settings.path : "";
			route.path = globalPath + (opts.path || "");
			route.path = route.path || "/";

			// Helper for aliased routes
			const createPath = (matchPath) => {
				let method = "*";
				if (matchPath.indexOf(" ") !== -1) {
					const p = matchPath.split(/\s+/);
					method = p[0];
					matchPath = p[1];
        }
				if (matchPath.startsWith("/")) matchPath = matchPath.slice(1);

        this.logger.info(`add to swagger: ${method} ${route.path + (route.path.endsWith("/") ? "": "/")}${matchPath}`);
        let swaggerPath = {
          [`${route.path + (route.path.endsWith("/") ? "": "/")}${matchPath}`]: {
            [method.toLowerCase()]: {
              tags: [],
              summary: "",
              description: "",
              operationId: "",
              consumes: this.settings.swagger.consumes || [
                "application/json",
                "application/xml"
              ],
              produces: this.settings.swagger.produces || [
                "application/xml",
                "application/json"
              ],
              parameters: [{
                in: "body",
                name: "body",
                description: "",
                required: true,
                schema: {}
              }],
              responses: {
                200: {
                  description: "success"
                }
              },
              security: [{
                jwt: []
              }]
            }
          }
        };

				return swaggerPath;
			};

      let paths = {};
			// Handle aliases
			if (opts.aliases && Object.keys(opts.aliases).length > 0) {
				route.aliases = [];
				for ( let matchPath of Object.keys(opts.aliases)) {
					if (matchPath.startsWith("REST ")) {
						const p = matchPath.split(/\s+/);
						const pathName = p[1];

            // Generate RESTful API. More info http://www.restapitutorial.com/
						Object.assign(paths, createPath(`GET ${pathName}/:id`));
						Object.assign(paths, createPath(`POST ${pathName}`));
						Object.assign(paths, createPath(`PUT ${pathName}/:id`));
						Object.assign(paths, createPath(`PATCH ${pathName}/:id`));
						Object.assign(paths, createPath(`DELETE ${pathName}/:id`));
					} else {
						Object.assign(paths, createPath(matchPath));
					}
				};
			}

			return paths;
    }
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
    if (this.settings.middleware) return;

    // Process routes
		if (Array.isArray(this.settings.routes)) {
      this.swagger = this.createSwagger(this.settings.routes);
		}

    this.server.get("/", (req, res) => {
      res.sendFile('index.html');
    });
    
    this.server.get("/yml", (req, res) => {
      res.type('application/x-yaml');
      res.send(yaml.safeDump(this.settings.swaggerCache, { skipInvalid: true }));
    });

    this.server.get("/json", (req, res) => {
      res.send(this.settings.swaggerCache);
    });

    this.server.listen(this.settings.port, this.settings.ip, (err, address) => {
      if (err) throw err;
			this.logger.info(`Swagger listening on ${address}`);
    });
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
    if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}

		if (this.server.listening) {
			/* istanbul ignore next */
			this.server.server.close(err => {
				if (err)
					return this.logger.error("Swagger close error!", err);

				this.logger.info("Swagger stopped!");
			});
		}
	}
};
