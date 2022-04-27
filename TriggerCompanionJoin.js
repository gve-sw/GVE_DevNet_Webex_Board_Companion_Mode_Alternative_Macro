/*
Copyright (c) 2020 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*/
import xapi from 'xapi';

// Please configure the following constant variables
const COMPANION_IP = ''; // IP address or hostname of associated board to send join/disconnect commands to
const COMPANION_USERNAME='username'; // username of account with admin priviledges on board to be able to send commands
const COMPANION_PASSWORD='password'; // password of account with admin priviledges on board to be able to send commands
const AUTOMATIC_CONNECT=true; // Leave 'true' if you would like the macro to send a command to the board to join whenever a call
                                // connects on this device. Set to 'false' if you want to invoke that using the custom panel button
                                // (custom panel button is always an option irrespective of this setting if it is properly configured in the UI extensions editor)



var callDestination = '';
const BTN_MANUAL_JOIN = 'panel_manual_board_join'

function encode(s) {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    o = [];
    for (var i = 0, n = s.length; i < n;) {
      var c1 = s.charCodeAt(i++),
      c2 = s.charCodeAt(i++),
      c3 = s.charCodeAt(i++);
      o.push(c.charAt(c1 >> 2));
      o.push(c.charAt(((c1 & 3) << 4) | (c2 >> 4)));
      o.push(c.charAt(i < n + 2 ? ((c2 & 15) << 2) | (c3 >> 6) : 64));
      o.push(c.charAt(i < n + 1 ? c3 & 63 : 64));
    }
  return o.join("");
}

// To send an HTTP Post to the companion Board, a Base64 encoded string composed of "username:password" is needed when using Basic Authentication
// This can be obtained using a tool such as https://www.base64encode.org/
// but here we used the encode() function above to perform the encoding using the COMPANION_USERNAME and COMPANION_PASSWORD constants declared above.
// and storing in COMPANION_USERNAMEPWD_BASE64 for use with the HTTP Post command below.
const COMPANION_USERNAMEPWD_BASE64=encode(COMPANION_USERNAME+':'+COMPANION_PASSWORD);

function sendCompanionDeviceJoin()
{

    let url = 'https://' + COMPANION_IP + '/putxml';
    let headers = [
      'Content-Type: text/xml',
      'Authorization: Basic ' + COMPANION_USERNAMEPWD_BASE64
    ];

    let payload = "<XmlDoc internal='True'><Command><Message><Send><Text>"+ "JoinMeeting:"+callDestination +"</Text></Send></Message></Command></XmlDoc>";

    xapi.command('HttpClient Post', {Url: url, Header: headers, AllowInsecureHTTPS: 'True'}, payload)
      .then((response) => {if(response.StatusCode === "200") {console.log("Successfully sent: " + payload)}});
}

function sendCompanionDeviceShowJoin()
{

    let url = 'https://' + COMPANION_IP + '/putxml';
    let headers = [
      'Content-Type: text/xml',
      'Authorization: Basic ' + COMPANION_USERNAMEPWD_BASE64
    ];

    let payload = "<XmlDoc internal='True'><Command><Message><Send><Text>"+ "ShowJoinMeeting:"+callDestination +"</Text></Send></Message></Command></XmlDoc>";

    xapi.command('HttpClient Post', {Url: url, Header: headers, AllowInsecureHTTPS: 'True'}, payload)
      .then((response) => {if(response.StatusCode === "200") {console.log("Successfully sent: " + payload)}});
}

function sendCompanionDeviceDisconnect()
{

    let url = 'https://' + COMPANION_IP + '/putxml';
    let headers = [
      'Content-Type: text/xml',
      'Authorization: Basic ' + COMPANION_USERNAMEPWD_BASE64
    ];

    let payload = "<XmlDoc internal='True'><Command><Message><Send><Text>"+ "DisconnectMeeting" +"</Text></Send></Message></Command></XmlDoc>";

    xapi.command('HttpClient Post', {Url: url, Header: headers, AllowInsecureHTTPS: 'True'}, payload)
      .then((response) => {if(response.StatusCode === "200") {console.log("Successfully sent: " + payload)}});
}

function handlePanelButtonClicked(event) {
        if(event.PanelId == BTN_MANUAL_JOIN){
            sendCompanionDeviceJoin();
        }
}

function listenToCalls()
{
    xapi.event.on('UserInterface Extensions Panel Clicked', (event) =>
                            handlePanelButtonClicked(event));


     xapi.Event.OutgoingCallIndication.on(async () => {
            const call = await xapi.Status.Call.get();
            console.log(call);
            callDestination = call[0].CallbackNumber;
        });

    xapi.Event.CallSuccessful.on(async () => {
        const call = await xapi.Status.Call.get();
        var theDestination=call[0].CallbackNumber;
        console.log("Connected call to/from: ", theDestination);
        console.log("Destination captured upon outbound event: ", callDestination)
        // only connect automatically if flag set
        if (AUTOMATIC_CONNECT) {
            console.log("Auto-connect enabled, send command to board...")
            sendCompanionDeviceJoin();
        }
        else
        {
            sendCompanionDeviceShowJoin();
        }

    });

    xapi.Event.CallDisconnect.on(async () => {
        const call = await xapi.Status.Call.get();

        console.log("Call disconnected orig destination ", callDestination," disconnect callbacknumber ", call[0].CallbackNumber);
        callDestination='';
        sendCompanionDeviceDisconnect();

    });

}

// ---------------------- ERROR HANDLING

function handleError(error) {
  console.log(error);
}

function init() {
    // configure HTTP settings
    xapi.config.set('HttpClient Mode', 'On').catch(handleError);
    xapi.config.set('HttpClient AllowInsecureHTTPS:', 'True').catch(handleError);
    xapi.config.set('HttpClient AllowHTTP:', 'True').catch(handleError);
        // register handler for Widget actions


    if (COMPANION_IP!='') {
        listenToCalls();
        }
}


init();