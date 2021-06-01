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

const COMPANION_IP = '';
const COMPANION_USERNAMEPWD_BASE64 = ''; // format is "username:password" for basic Authorization. This needs to be base64-encoded. Use e.g. https://www.base64encode.org/ to do this

function sendCompanionDeviceJoin()
{

    let url = 'https://' + COMPANION_IP + '/putxml';
    let headers = [
      'Content-Type: text/xml',
      'Authorization: Basic ' + COMPANION_USERNAMEPWD_BASE64
    ];

    let payload = "<XmlDoc internal='True'><Command><Message><Send><Text>"+ "JoinMeeting" +"</Text></Send></Message></Command></XmlDoc>";

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

function listenToCalls()
{
    xapi.Event.CallSuccessful.on(async () => {
        const call = await xapi.Status.Call.get();

        console.log(call[0].CallbackNumber);
        sendCompanionDeviceJoin();

    });

    xapi.Event.CallDisconnect.on(async () => {
        const call = await xapi.Status.Call.get();

        console.log(call[0].CallbackNumber);
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
    if (COMPANION_IP!='') {
        listenToCalls();
        }
}


init();