const fs = require('fs');
const request = require('request');
const { messages } = require('elasticio-node');

const genEIOJsonSchFromSwaggerJsonSch = require('../convert_schema.js');
const handler = require('../handler.js');

exports.process = action;
exports.getEndpoint = getEndpoint;
exports.getMetaModel = getMetaModel;

// exports.process({
//     body: {
//         jobCode: '64a4b742-44fa-4515-a616-341342ffa2d6:::02761987-c81e-4f57-953b-6d884f9b4a15'
//     }
// }, {
//     username: '',
//     password: '',
//     apiURI: 'https://content-api.lionbridge.com/v1'
// }).then(process.exit).catch(console.error);

async function action(msg, cfg) {
    const [
        method,
        tag,
        url
    ] = cfg.endpoint.split(' ');

    return handler(url, method.toLowerCase()).bind(this)(msg, cfg);
}

// getEndpoint({
//     swaggerFileURI: 'https://api.myjson.com/bins/qna0r'
// }).then(process.exit).catch(console.error);

async function getEndpoint(cfg) {
    const swaggerFile = await new Promise((resolve, reject) => {
        request.get({
            uri: cfg.swaggerFileURI
        }, (err, response, body) => {
            err ? reject(err): resolve(JSON.parse(body));
        })
    });

    const endpoints = {};

    for (const path in swaggerFile.paths) {
        for (const httpMethod in swaggerFile.paths[path]) {
            const tag = swaggerFile.paths[path][httpMethod].tags.join('_');

            const functionLabel = `${httpMethod.toUpperCase()} ${tag} ${path}`;

            endpoints[functionLabel] = functionLabel;
        }
    }

    console.log('endpoints', endpoints);

    return endpoints;
}

// getMetaModel({
//     swaggerFileURI: 'https://api.myjson.com/bins/qna0r',
//     endpoint: 'POST pet /pet'
// }, console.log).then(process.exit).catch(console.error);

function getMetaModel(cfg, cb) {
    (async () => {
        const swaggerFile = await new Promise((resolve, reject) => {
            request.get({
                uri: cfg.swaggerFileURI
            }, (err, response, body) => {
                err ? reject(err): resolve(JSON.parse(body));
            })
        });

        const [
            httpMethod,
            tag,
            url
        ] = cfg.endpoint.split(' ');

        const {
            inMetadata,
            outMetadata
        } = createSchemas(swaggerFile.paths[url][httpMethod.toLowerCase()], swaggerFile);

        cb(null, {
            in: inMetadata,
            out: outMetadata
        })
    })();
}

function createSchemas(data, swaggerFile) {
    const result = {};

    if (data.parameters) {
        writeInMetadata();
    }

    writeOutMetadata();

    function writeInMetadata() {
        const eioSchema = data.parameters.reduce((obj, param) => {
            if (param.in === 'body') {
                try {
                    obj.properties.body = genEIOJsonSchFromSwaggerJsonSch(swaggerFile, param.schema);

                    if (!obj.properties.body.type) {
                        obj.properties.body.type = 'object';
                    }
                } catch (error) {
                    console.log(error.message);

                    return obj;
                }

                return obj;
            }

            obj.properties[param.in] = obj.properties[param.in] || {
                type: 'object',
                properties: {}
            };

            obj.properties[param.in].properties[param.name] = {
                type: param.type,
                required: !!param.required
            };

            return obj;
        }, {
            type: 'object',
            properties: {
                additionalCreds: {
                    type: 'object',
                    properties: {
                        headers: {
                            type: 'string'
                        },
                        queryString: {
                            type: 'string'
                        },
                        apiURI: {
                            type: 'string'
                        }
                    }
                }
            }
        });

        result.inMetadata = eioSchema;
    }

    function writeOutMetadata() {
        let eioSchema;

        try {
            const response = (data.responses[200] || data.responses[204] || data.responses.default);

            if (!response || !response.schema) {
                eioSchema = {
                    description: `There is no schema for this response. ${response ? 'Source value: ' + JSON.stringify(response) : ''}`
                }
            } else {
                eioSchema = genEIOJsonSchFromSwaggerJsonSch(
                    swaggerFile,
                    response.schema
                );
            }

        } catch (error) {
            console.log(error.message);

            return;
        }

        result.outMetadata = eioSchema;
    }

    return result;
}
