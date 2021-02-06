import config from './config.js';
import tmi from 'tmi.js';
import axios from 'axios';
import sdk from 'cue-sdk';
import { changeIcueColor, doRainbow, pulse } from './ICUE.js';
import { changeLifxColor } from './Lifx.js';

let subs = [];
let revoked = [];
let isHype = false;
let isPulse = false;

const authorizedUsers = ["yuval59", "Huuge"];
const validColors = ["yellow", "purple", "orange", "red", "cyan", "blue", "white", "green", "pink"];

const userName = 'Yuval_Bot';
const connectedChannels = ['yuval59'];


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

client.connect()
    .then(console.log(`Connected to channels ${connectedChannels} as ${userName}`));

client.on('message', (channel, tags, message, self) => {

    if (self) return;

    let color = 'default';

    const n = message[0];

    message = message.toLowerCase().split(' ');

    if (message.length == 2 && n == "!") {

        switch (message[0]) {

            default: {
                client.say(channel, `Sorry @${tags['display-name']}, ${message[0]} is not a command`)
                break;
            }

            case ("!color"): {

                if(message[1]=="list"){
                    client.say(channel,`Hi @${tags['display-name']} - the current available colors are Yellow, Purple, Orange, Red, Cyan, Blue, White, Green, Pink`)
                    break;
                }

                if (isHype) {

                    client.say(channel, `Sorry @${tags['display-name']}, the stream lights are currently in hype mode`)

                } else {

                    if (subs.includes(tags['display-name']) || authorizedUsers.includes(tags['display-name'])) {

                        if (validColors.includes(message[1])) {

                            color = message[1];

                        } else {

                            client.say(channel, `Sorry @${tags['display-name']}, "${message[1]}" is not a valid color`);

                        }

                        if (color != 'default') {

                            changeIcueColor(color);
                            changeLifxColor(color);

                            client.say(channel, `@${tags['display-name']} has changed the color of the lights to ${color}`);

                            if (!authorizedUsers.includes(tags['display-name'])) {

                                const index = subs.indexOf(tags['display-name']);
                                subs.splice(index, 1);
                                revoked.push(tags['display-name']);
                            }

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
                if (tags['mod'] || authorizedUsers.includes(tags['display-name'])) {
                    switch (message[1]) {
                        default: {
                            client.say(channel, `Sorry @${tags['display-name']}, ${message} is not a valid state`);
                            break;
                        }
                        case ('on'): {
                            if (isHype) {
                                client.say(channel, `Stream is already in hype mode`);
                                break;
                            }
                            client.say(channel, `Stream is now in hype mode`);
                            isHype = true;

                            doRainbow();
                            lifxHype();

                            break;
                        }
                        case ('off'): {
                            client.say(channel, `Stream is no longer in hype mode`);
                            isHype = false;

                            changeLifxColor("white");
                        }
                    }
                }

                break;
            }

            case ("!pulse"): {
                if (tags['mod'] || tags['display-name'] == "yuval59") {
                    switch (message[1]) {
                        default: {
                            client.say(channel, `Sorry @${tags['display-name']}, ${message} is not a valid state`);
                            break;
                        }
                        case ('on'): {
                            if (isPulse) {
                                client.say(channel, `Stream is already in pulse mode`);
                            }
                            client.say(channel, `Stream is now in pulse mode`);
                            isPulse = true;
                            pulse();
                            break;
                        }
                        case ('off'): {
                            client.say(channel, `Stream is no longer in pulse mode`);
                            isPulse = false;
                            break;
                        }
                    }
                }

                break;

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
