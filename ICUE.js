//This class handles all the Icue logic integration

import sdk from 'cue-sdk';
import rgb from 'hsv-rgb';
import hexRgb from 'hex-rgb';

//Declare the constant base colors as to imitate Lifx's colors as closely as possible.
//This is not a good, dynamic way to do this.
const colorDict = {
    white:{
        r:255,
        g:255,
        b:255
    },
    red:{
        r:255,
        g:0,
        b:0
    },
    green:{
        r:0,
        g:255,
        b:0
    },
    blue:{
        r:0,
        g:0,
        b:255
    },
    cyan:{
        r:0,
        g:255,
        b:255
    },
    orange:{
        r:255,
        g:128,
        b:0
    },
    yellow:{
        r:255,
        g:255,
        b:0
    },
    purple:{
        r:128,
        g:0,
        b:255
    },
    pink:{
        r:255,
        g:0,
        b:128
    }
};

//------------------------------\\
//                              \\
//      ICUE integrations       \\
//                              \\
//------------------------------\\

//This function gets and returns all available LEDs
function getAvailableLeds() {
    const leds = []
    const deviceCount = sdk.CorsairGetDeviceCount()
    for (let di = 0; di < deviceCount; ++di) {
        const ledPositions = sdk.CorsairGetLedPositionsByDeviceIndex(di)
        leds.push(ledPositions.map(p => ({ ledId: p.ledId, r: 0, g: 0, b: 0 })))
    }

    return leds
};

//This function makes all LEDs rotate through all rainbow colors
export async function doRainbow() {

    const details = sdk.CorsairPerformProtocolHandshake()
    const errCode = sdk.CorsairGetLastError()

    //Exit if handshake failed
    if (errCode !== 0) {
        console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`)
        exit(1)
    }

    const availableLeds = getAvailableLeds()

    //Exit if no LEDs were found
    if (!availableLeds.length) {
        console.error('No devices found')
        exit(1)
    }

    //Declare a starting value for the Hue color
    let currentHue = 0;

    //Every 1 ms increase hue by a constant amount and apply to all available LEDs
    setInterval(() => {
        currentHue = (currentHue + 0.2) % 360;

        const val = rgb(currentHue, 100, 100);

        for (let i = 0; i < availableLeds.length; ++i) {

            const device_leds = availableLeds[i]
            device_leds.forEach(led => {
                led.r = val[0]
                led.g = val[1]
                led.b = val[2]
            })

            sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
        }
        sdk.CorsairSetLedsColorsFlushBuffer()
    }, 1);
};

//Change all LEDs to the same constant color
export const changeIcueColor = (color, type) => {

    const details = sdk.CorsairPerformProtocolHandshake()
    const errCode = sdk.CorsairGetLastError()

    //Exit if handshake failed
    if (errCode !== 0) {
        console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`)
        exit(1)
    }

    const availableLeds = getAvailableLeds()

    //Exit if no LEDs were found
    if (!availableLeds.length) {
        console.error('No devices found')
        exit(1)
    }

    //Received the name of the chosen color out of the list
    if (type == 'string') {

        //Iterate through all available LEDs and apply the chosen color
        for (let i = 0; i < availableLeds.length; ++i) {

            const device_leds = availableLeds[i]
            device_leds.forEach(led => {
                led.r = colorDict[color].r
                led.g = colorDict[color].g
                led.b = colorDict[color].b
            })

            sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
        }

        sdk.CorsairSetLedsColorsFlushBuffer()
        return;
    }

    //Receiving hex colors
    if (type == 'hex') {

        //Iterate through all available LEDs and apply the chosen color
        for (let i = 0; i < availableLeds.length; ++i) {

            const rgbDict = hexRgb(color);

            const device_leds = availableLeds[i]

            device_leds.forEach(led => {
                led.r = rgbDict.red
                led.g = rgbDict.green
                led.b = rgbDict.blue
            })

            sdk.CorsairSetLedsColorsBufferByDeviceIndex(i, device_leds)
        }

        sdk.CorsairSetLedsColorsFlushBuffer()
        return;
    }
};