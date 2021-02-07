import config from './config.js';
import tmi from 'tmi.js';
import { changeIcueColor, doRainbow } from './ICUE.js';
import { changeLifxColor, lifxHype } from './Lifx.js';

//Declare the array of users that subbed during the stream and are eligible to change colors
let subs = [];

//Declare the array of users that have already used the command
let revoked = [];

//Declare if the stream is in hype mode - default is false
let isHype = false;

//Declare the current color - starts off as white.
let currentColor = "white";

//Declare users with access to all commands always
const authorizedUsers = ["yuval59", "Huuge"];

//Declare all colors that are available to the users
const validColors = ["yellow", "purple", "orange", "red", "cyan", "blue", "white", "green", "pink"];

//Declare the user the bot is connecting to
const userName = 'Yuval_Bot';

//Declare the channels the bot is monitoring
const connectedChannels = ['yuval59'];

//Get all valid colors to a string in order to clarify to user what colors are available to them
const colorsAsString = () => {

    let colorString = '';

    validColors.forEach(color => {
        colorString = colorString + `${color} `;
    })

    return colorString;

};

//Change the Corsair lights to white on startup 
changeIcueColor('white');

//Change the LIFX lights to white on startup 
changeLifxColor('white');

//--------------------------------\\
//                                \\
//       Twitch integrations      \\
//                                \\
//--------------------------------\\

//connect to Twitch chat using tmi.js api
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

//Perform initial connection to Twitch chat
client.connect()
    .then(console.log(`Connected to channels ${connectedChannels} as ${userName}`))
    .catch(function (error) {
        // handle error
        console.error(error);
    });

//Listen to new messages
client.on('message', (channel, tags, message, self) => {

    //Don't progress on self-sent messages
    if (self) return;

    //Don't progress on messages that are not a command
    if (message[0] != "!") return;

    //Declare color variable to be passed on to color changing functions - this starts on default and if changed is sent onwards
    let color = 'default';

    //Split the received message into different elements by space
    message = message.toLowerCase().split(' ');

    //Check for commands based on the number of elements that was received in the message
    switch (message.length) {

        case (1): {

            switch (message[0]) {

                case ('!color'): {

                    //The bot received the command without a color after it, explain the syntax
                    client.say(channel, `Hi @${tags['display-name']}, please use !color followed by the color you prefer. You can check available colors by typing !color list`)
                    break;

                }

                case ("!hype"): {

                    //Check if the user is a moderator of the channel or an authorized user
                    if (tags['mod'] || authorizedUsers.includes(tags['display-name'])) {

                        //Declare the stream in hype mode and toggle the check to true
                        client.say(channel, `Stream is now in hype mode`);
                        isHype = true;

                        //Change the Corsair colors to rainbow
                        doRainbow();

                        //Change the LIFX lights to a moving rainbow
                        lifxHype();

                        break;
                    }

                    break;
                }

            }

            break;

        };

        case (2): {

            switch (message[0]) {

                //When receiving command !color {something}
                case ("!color"): {

                    //If received !color list, type out available colors.
                    if (message[1] == "list") {

                        client.say(channel, `Hi @${tags['display-name']} - the current available colors are ${colorsAsString}`)
                        break;

                    }

                    //If the stream is in hype mode, tell the user to fuck off
                    if (isHype) {

                        client.say(channel, `Sorry @${tags['display-name']}, the stream lights are currently in hype mode`)

                        //if not
                    } else {

                        //If the user is in the eligible subs list, or an authorized user, or a moderator of the stream - let them execute the command...
                        if (subs.includes(tags['display-name']) || authorizedUsers.includes(tags['display-name']) || tags['mod']) {

                            if (validColors.includes(message[1])) {

                                color = message[1];

                            } else {

                                client.say(channel, `Sorry @${tags['display-name']}, "${message[1]}" is not a valid color`);

                            }

                            //Execute change of color if the color was not changed
                            if (color != 'default') {

                                //Check if the color has actually changed value
                                if (color == currentColor) {

                                    //If the lights have not changed color, tell the user to fuck off and exit
                                    client.say(channel, `Sorry @${tags['display-name']}, the stream colors are already set to this color`);
                                    return;

                                }

                                //--------------------------------\\
                                //If the lights have changed color\\
                                //--------------------------------\\

                                //Change the Corsair lights to the chosen color
                                changeIcueColor(color);

                                //Change the LIFX lights to the chosen color
                                changeLifxColor(color);

                                //Set currentColor to the chosen color
                                currentColor = color;

                                client.say(channel, `@${tags['display-name']} has changed the color of the lights to ${color}`);

                                //If the user calling this action is not a moderator of the channel or an authorized user
                                if (!authorizedUsers.includes(tags['display-name']) && !tags['mod']) {

                                    //Get the index of the user in the array and remove him
                                    const index = subs.indexOf(tags['display-name']);
                                    subs.splice(index, 1);

                                    //Put him in the 'already used the command' array
                                    revoked.push(tags['display-name']);
                                }

                            }

                            //... Otherwise tell them to fuck off
                        } else {

                            //Different messages depending on whether they already changed the color during the stream or just have not subscribed
                            if (revoked.includes(tags['display-name'])) {

                                client.say(channel, `@${tags['display-name']}, you have already changed the stream color`)

                            } else {

                                client.say(channel, `@${tags['display-name']}, you have not subscribed during this stream and cannot change the stream color`)

                            }

                        }

                    }
                    break;
                }

            }

            break;

        };

        case (3): {

            switch (message[0]) {

                //When receiving command !color {something}
                case ("!color"): {

                    //If the stream is in hype mode, tell the user to fuck off
                    if (isHype) {

                        client.say(channel, `Sorry @${tags['display-name']}, the stream lights are currently in hype mode`)

                        //if not
                    } else {

                        //If the user is in the eligible subs list, or an authorized user, or a moderator of the stream - let them execute the command...
                        if (subs.includes(tags['display-name']) || authorizedUsers.includes(tags['display-name']) || tags['mod']) {

                            if (validColors.includes(message[1])) {

                                color = message[1];

                            } else {

                                client.say(channel, `Sorry @${tags['display-name']}, "${message[1]}" is not a valid color`);

                            }

                            //Execute change of color if the color was not changed
                            if (color != 'default') {

                                //Check if the color has actually changed value
                                if (color == currentColor) {

                                    //If the lights have not changed color, tell the user to fuck off and exit this call
                                    client.say(channel, `Sorry @${tags['display-name']}, the stream colors are already in this color`);
                                    return;

                                }

                                //If the lights have changed color

                                //Change the Corsair lights to the chosen color
                                changeIcueColor(color);

                                //Change the LIFX lights to the chosen color
                                changeLifxColor(color);

                                client.say(channel, `@${tags['display-name']} has changed the color of the lights to ${color}`);

                                //If the user calling this action is not a moderator of the channel or an authorized user
                                if (!authorizedUsers.includes(tags['display-name']) && !tags['mod']) {

                                    //Get the index of the user in the array and remove him
                                    const index = subs.indexOf(tags['display-name']);
                                    subs.splice(index, 1);

                                    //Put him in the 'already used the command' array
                                    revoked.push(tags['display-name']);
                                }

                            }

                            //... Otherwise tell them to fuck off
                        } else {

                            //Different messages depending on whether they already changed the color during the stream or just have not subscribed
                            if (revoked.includes(tags['display-name'])) {

                                client.say(channel, `@${tags['display-name']}, you have already changed the stream color`)

                            } else {

                                client.say(channel, `@${tags['display-name']}, you have not subscribed during this stream and cannot change the stream color`)

                            }

                        }

                    }
                    break;
                }

            }
            break;

        };

    }

});

//In event of a subscription add username to eligible subs list
client.on('subscription', (channel, username, methods, msg, tags) => {

    console.log("-----------subscription event has been called-----------")

    subs.push(username);

});

//In event of a re-subscription add username to eligible subs list
client.on('resub', (channel, username, streakMonths, msg, tags, methods) => {

    console.log("-----------resub event has been called-----------")

    subs.push(username);

});

//In event of a gifted sub add sub receiver to eligible subs list
client.on("subgift", (channel, username, recipient, methods, tags, userstate) => {

    console.log("-----------subgift event has been called-----------")

    subs.push(userstate["msg-param-recipient-display-name"]);

});

//In event of a gifted sub add the sub gifter to eligible subs list if he has given more than five subs
client.on("submysterygift", (channel, username, giftSubCount, methods, tag) => {

    console.log("-----------submysterygift event has been called-----------")

    if (giftSubCount >= 5) {

        cllient.say(`Hi @${username} - You have gifted five or more subs and are therefor eligible to change the stream lights color. Please use !color for further instructions.`);

        subs.push(username);
    }

});