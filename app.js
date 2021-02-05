import config from './config.js';
import tmi from 'tmi.js';
import axios from 'axios';
import sdk from 'cue-sdk';

let subs = ['yuval59'];
let revoked = [];
let isHype = false;

const validColors = ["yellow", "purple", "orange", "red", "cyan", "blue", "white", "green", "pink"]
const makerKey = config.MAKERKEY;
const scene_uuid = config.scene;

const userName = 'Yuval_Bot';
const connectedChannels = ['yuval59'];

const headers = {
    "Authorization": "Bearer " + config.LIFXKEY,
};

const client = new tmi.Client({

    connection: {
        secure: true,
        reconnect: true
    },

    //Get OAUTH at https://twitchapps.com/tmi/
    identity: {
        username: userName,
        password: config.OAUTH
    },
    channels: connectedChannels

});

const details = sdk.CorsairPerformProtocolHandshake();
const errCode = sdk.CorsairGetLastError();
if (errCode === 0) {
    // 'CE_Success'
}

const changeColor = (color => {

    console.log(`--------changeColor has been called--------`);

    const n = sdk.CorsairGetDeviceCount();

    console.log(n);
    const leds = []

    for (let i = 0; i < n; ++i) {
        const info = sdk.CorsairGetDeviceInfo(i);
        const ledPositions = sdk.CorsairGetLedPositionsByDeviceIndex(i)
        leds.push(ledPositions.map(p => ({ ledId: p.ledId, r: 0, g: 0, b: 0 })));

        for (let tmp = 0; tmp < leds.length; tmp++) {

            leds[tmp].forEach(led => {
                led.r = 0
                led.g = 230
                led.b = 0
            })
        }

        // // example: read device properties
        // if (info.capsMask & sdk.CorsairDeviceCaps.CDC_PropertyLookup) {
        //     console.log(info);
        //     Object.keys(sdk.CorsairDevicePropertyId).forEach(p => {
        //         const prop = sdk.CorsairGetDeviceProperty(i, sdk.CorsairDevicePropertyId[p]);
        //         if (!prop) {
        //             console.log(p, ':', sdk.CorsairErrorString[sdk.CorsairGetLastError()]);
        //         } else {
        //             console.log(p, prop.value);
        //         }
        //         sdk.changeColor(color);
        //     });
        // }
    }
});

client.connect()
    .then(console.log(`Connected to channels ${connectedChannels} as ${userName}`));

client.on('message', (channel, tags, message, self) => {

    if (self) return;

    //console.log(`${tags['display-name']}: ${message}`);

    let color = 'default';

    message = message.toLowerCase().split(' ');

    if (message.length == 2) {

        switch (message[0]) {

            default: {
                client.say(channel, `Sorry @${tags['display-name']}, ${message[0]} is not a command`)
            }

            case ("!color"): {
                if (isHype) {

                    client.say(channel, `Sorry @${tags['display-name']}, the stream lights are currently in hype mode`)

                } else {

                    if (subs.includes(tags['display-name'])) {

                        if (validColors.includes(message[1])) {

                            color = message[1];

                        } else {

                            client.say(channel, `Sorry @${tags['display-name']}, "${message[1]}" is not a valid color`);

                        }

                        if (color != 'default') {

                            const data = {
                                color: color,
                                brightness: 1,
                                fast: false
                            };

                            axios.put(`https://api.lifx.com/v1/lights/all/state`, data, { headers: headers })
                                .then(function (response) {
                                    // handle success
                                    console.log(`Color change to ${color} successful`);

                                })
                                .catch(function (error) {
                                    // handle error
                                    console.error(error);
                                });

                            client.say(channel, `@${tags['display-name']} has changed the color of the lights to ${color}`);

                            const index = subs.indexOf(tags['display-name']);
                            subs.splice(index, 1);
                            revoked.push(tags['display-name']);

                            changeColor("");

                        }

                    } else {

                        if (revoked.includes(tags['display-name'])) {
                            client.say(channel, `@${tags['display-name']}, you have already changed the stream color`)
                        } else {
                            client.say(channel, `@${tags['display-name']}, you have not subscribed during this stream and cannot change the stream color`)
                        }

                    }

                }
                break;
            }

            case ("!hype"): {
                if (tags['mod'] || tags['display-name'] == "yuval59") {
                    switch (message[1]) {
                        default: {
                            client.say(channel, `Sorry @${tags['display-name']}, ${message} is not a valid state`);
                            break;
                        }
                        case ('on'): {
                            client.say(channel, `Stream is now in hype mode`);
                            isHype = true;

                            const moveData = {
                                direction: 'backward',
                                period: 4,
                                fast: false
                            };

                            const sceneData = {
                                fast: true
                            };

                            axios.put(`https://api.lifx.com/v1/scenes/scene_id:${scene_uuid}/activate`, sceneData, { headers: headers })
                                .then(function (response) {
                                    // handle success
                                    console.log(`Scene change successful`);
                                })
                                .catch(function (error) {
                                    // handle error
                                    console.error(error);
                                });

                            axios.post(`https://api.lifx.com/v1/lights/all/effects/move`, moveData, { headers: headers })
                                .then(function (response) {
                                    // handle success
                                    console.log(`Move successful`);
                                })
                                .catch(function (error) {
                                    // handle error
                                    console.error(error);
                                });

                            break;
                        }
                        case ('off'): {
                            client.say(channel, `Stream is no longer in hype mode`);
                            isHype = false;

                            axios.post(`http://maker.ifttt.com/trigger/white/with/key/${makerKey}`)
                                .then(function (response) {
                                    // handle success
                                    //console.log('whatsapp message sent response >>>', response.data);
                                })
                                .catch(function (error) {
                                    // handle error
                                    console.error(error);
                                });

                            break;
                        }
                    }
                }
            }

        }

    }

});

client.on('subscription', (channel, tags, username) => {
    console.log(`${tags['display-name']} has subscribed`);
    if (!subs.includes(tags['display-name'])) {
        subs.push(username);
    }
});

client.on('resub', (channel, tags, username) => {
    console.log(`${tags['display-name']} has re-subscribed`);
    if (!subs.includes(tags['display-name'])) {
        subs.push(username);
    }
});