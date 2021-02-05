import config from './config.js';
import tmi from 'tmi.js';
import axios from 'axios';

let subs = ['yuval59'];
let revoked = [];
let isHype = false;

const validColors = ["yellow", "purple", "orange", "red", "cyan", "blue", "white", "green", "pink"]
const makerKey = config.MAKERKEY;
const scene_uuid = config.scene;

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
        username: 'Yuval_Bot',
        password: config.OAUTH
    },
    channels: ['yuval59']

});

client.connect();

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

                            axios.put(`https://api.lifx.com/v1/lights/all/state`, data, {headers: headers})
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