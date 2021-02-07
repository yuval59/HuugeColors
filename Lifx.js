//This class handles all the Lifx integration logic

import config from './config.js';
import axios from 'axios';

//Declare Bearer authorization
const headers = {
    "Authorization": "Bearer " + config.LIFXKEY,
};

//Declare the scene_uuid for the rainbow color scene on the Lifx app
const scene_uuid = config.scene;

//------------------------------\\
//                              \\
//      Lifx integrations       \\
//                              \\
//------------------------------\\

//Take a color string(out of a select couple of valid colors - see validColors on app.js)
export const changeLifxColor = (color) => {

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
};

//Change Lifx lights to a moving rainbow
export const lifxHype = () => {
    
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

    setTimeout(() => postMove(), 500);
};

function postMove(){

    const moveData = {
        direction: 'backward',
        period: 4,
        fast: false
    };

    axios.post(`https://api.lifx.com/v1/lights/all/effects/move`, moveData, { headers: headers })
        .then(function (response) {
            // handle success
            console.log(`Move successful`);
        })
        .catch(function (error) {
            // handle error
            console.error(error);
        })
}