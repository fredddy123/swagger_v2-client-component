const request = require('request');
const { messages } = require('elasticio-node');

const { createToken } = require('../utils.js');

exports.process = action;

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
    try {
        const actionResult = await exec.call(this, msg, cfg);

        console.log('actionResult', actionResult);

        return actionResult;
    } catch (err) {
        console.error('ERROR:', err);
        this.emit('error', err);
    } finally {
        this.emit('end');
    }
}

async function exec(msg, cfg) {
    console.log('msg', JSON.stringify(msg));
    console.log('cfg', JSON.stringify(cfg));

    const {
        jobCode
    } = msg.body;

    const {
        username,
        password,
        apiURI
    } = cfg;

    const [jobId] = jobCode.split(':::');

    const token = await createToken({
        username,
        password,
        apiURI
    });

    const statusUpdates = await getStatusUpdates(token, apiURI);

    const currentJob = statusUpdates.reduce((arr, item) => {
        if (item.jobId !== jobId) {
            return arr;
        }

        return arr.concat([item]);
    }, []);

    if (!currentJob.length) {
        return messages.newMessageWithBody({
            statusCode: 'REQUEST_IS_NOT_HANDLED_YET',
            jobCode: '-',
            updateTime: '-'
        });
    }

    return messages.newMessageWithBody({
        statusCode: currentJob[currentJob.length - 1].statusCode.statusCode,
        jobCode,
        updateTime: currentJob[currentJob.length - 1].updateTime
    });
}

async function getStatusUpdates(token, apiURI) {
    const reqOptions = {
        headers: {
            Authorization: token
        },
        uri: `${apiURI}/statusupdates`
    };

    const response = JSON.parse(await new Promise((resolve, reject) => {
        request.get(reqOptions, (err, response, body) => {
            if (err) {
                return reject(err);
            }

            resolve(body);
        });
    }));

    return response;
}
