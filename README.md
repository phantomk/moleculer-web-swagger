# moleculer-web-swagger

![npm-veriosn](https://img.shields.io/npm/v/moleculer-web-swagger.svg)
![npm-dt](https://img.shields.io/npm/dt/moleculer-web-swagger.svg)

This is a swagger plugin for moleculer-web, just simple.

## Install

```bash
npm install moleculer-web-swagger --save
```

## Usage

Add a service `swagger.service.js`, here is all options.

```javascript
const SwaggerService = require("moleculer-web-swagger");

module.exports = {
  mixins: [SwaggerService],
  settings: {
    middleware: false,
    port: 3002,
    ip: "0.0.0.0",
    expose: true,
    swagger: {
      info: {
        description: "moleculer apigateway swagger",
        version: "1.0.0",
        title: "moleculer-apigateway",
        termsOfService: "",
        contact: {
          name: "phantomk",
          url: "https://github.com/phantomk",
          email: "phantomk94@gmail.com"
        },
        license: {
          name: "Apache 2.0",
          url: "https://www.apache.org/licenses/LICENSE-2.0.html"
        }
      },
      host: "127.0.0.1:3002",
      basePath: "/v1",
      tags: [{
        name: "pet",
        description: "Everything about your Pets",
        externalDocs: {
          description: "Find out more",
          url: "http://swagger.io"
        }
      }],
      schemes: [
        "http",
        "https"
      ],
      consumes: [
        "application/json",
        "application/xml"
      ],
      produces: [
        "application/xml",
        "application/json"
      ],
    }

    routes: [
      // your moleculer-web routes
      // you can impoert from your moleculer-web service
    ]
  }
};
```

> Not support middleware

## Todo

- [ ] Support whitelist
- [ ] Support security
- [ ] Support auto read route

## License

The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).