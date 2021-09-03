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
const MAX_VOLUME=0;
const PREFER_JOIN_OBTP=true;

function setVolume(vol)
{
 xapi.Command.Audio.Volume.Set({ Level: vol });
}

function alert2(title, text = '', duration = 5)
{
    xapi.Command.UserInterface.Message.Alert.Display({
        Title: title,
        Text: text,
        Duration: duration,
    } );
}
function listenToCalls()
{
    xapi.Event.CallSuccessful.on(async () => {
        const call = await xapi.Status.Call.get();
        if (call.length < 1) {
            setMute(true);
        }
        
        console.log(call[0].CallbackNumber);
        setMute(true);
        xapi.Command.Video.Input.MainVideo.Mute();
        xapi.Command.Video.Layout.LayoutFamily.Set({ CustomLayoutName: 'value', LayoutFamily: 'overlay', Target: 'Local'});
        xapi.Command.Video.Selfview.Set({ Mode: 'off'});
        xapi.Command.Video.PresentationPIP.Set({ Position: 'UpperRight'});
        xapi.Command.Video.PresentationView.Set({ View: 'Maximized'});
    });
    xapi.Event.CallDisconnect.on(() => setMute(true));
}

function alert(title, text, duration = 5)
{
    xapi.Command.UserInterface.Message.Alert.Display({
    Title: title,
    Text: text,
    Duration: duration,
    });
}

function setMute(mute)
{
    if (mute) {
            xapi.Command.Audio.Microphones.Mute();
            alert2('A script automatically muted you');
        }
    else
        {
        xapi.Command.Audio.Microphones.Unmute();
        }
}

function limitVolume(volume)
{
 if (volume > MAX_VOLUME) {
    setVolume(MAX_VOLUME);
    alert(
        'Volume restricted',
        'Max volume on this video system is restricted by a script',
        );
    }
}

function companionDeviceJoin(destination)
{
    if (PREFER_JOIN_OBTP) {
        xapi.Command.Bookings.List().then(result =>
          {
            console.log(result.Booking[0].DialInfo.Calls.Call[0].Number);
            xapi.Command.Dial({Number: result.Booking[0].DialInfo.Calls.Call[0].Number});
            }
        );
    } else if (destination!='') {
        xapi.Command.Dial({Number: destination});
    }
    else
    {
        console.log('No destination to dial received from main codec, set PREFER_JOIN_OBTP to true if you wish to just dial scheduled meeting.')
    }
}

function companionDeviceDisconnect()
{
    xapi.Command.Call.Disconnect();
}

async function checkInitialVolume() {
        try {
            const volume = await xapi.Status.Audio.Volume.get();
            limitVolume(volume);
        } 
        catch (error) {
            console.error(error);
        }
}

function handleMessage(event) {
  console.log(`handleMessage: ${event.Text}`);
  var eventText=event.Text;
  var eventSplit=eventText.split(':');
  var parsedCommand=eventSplit[0];
  var destination='';
  var theProtocol='';
  if (eventSplit.length > 1) {
            // the destination URL likely comes with 'spark:' or 'h323'... we want to pass on to companionDeviceJoin()
            // just the destination without the protocol, but we do want to extract the protocol in case we want to make
            // other decisions on it.
            if (eventSplit.length > 2) {
              theProtocol=eventSplit[1];
              destination=eventSplit[2];
            } else {
              destination=eventSplit[1];
            }
        }

  switch(parsedCommand) {

    case "JoinMeeting":
      companionDeviceJoin(destination);
      break;

    case "DisconnectMeeting":
      companionDeviceDisconnect();
      break;
  }
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

    // register callback for processing messages from main codec
    xapi.event.on('Message Send', handleMessage);

    listenToCalls();
    xapi.Status.Audio.Volume.on((volume) => {
        console.log('Volume changed to: ${volume}');
        limitVolume(volume);
        });
    checkInitialVolume();
}


init();