/*
Copyright (c) 2022 Cisco and/or its affiliates.
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
const MAX_VOLUME=0;
const PREFER_JOIN_OBTP=true;
const LEAVE_CAMERA_ON=false;
const MANUAL_TOGGLE_FUNC=true;



var storedDestination='';
var storedPostDialKeys='';
const BTN_MANUAL_JOIN = 'panel_manual_board_join'
const BTN_TOGGLE= 'panel_manual_toggle'
var inCompanionMode=true;
var originalVolume=0;
var inCall=false;

function installOffButton() {
xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: 'panel_manual_toggle' },
    `<Extensions><Version>1.8</Version>
  <Panel>
    <Order>2</Order>
    <PanelId>panel_manual_toggle</PanelId>
    <Type>Home</Type>
    <Icon>Tv</Icon>
    <Color>#D43B52</Color>
    <Name>Turn Off Companion</Name>
    <ActivityType>Custom</ActivityType>
  </Panel>
</Extensions>`);
}

function installOnButton() {
xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: 'panel_manual_toggle' },
    `<Extensions><Version>1.8</Version>
  <Panel>
    <Order>2</Order>
    <PanelId>panel_manual_toggle</PanelId>
    <Type>Home</Type>
    <Icon>Tv</Icon>
    <Color>#1D805F</Color>
    <Name>Turn On Companion</Name>
    <ActivityType>Custom</ActivityType>
  </Panel>
</Extensions>`);
}

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
        if (inCompanionMode) {
            const call = await xapi.Status.Call.get();
            if (call.length < 1) {
                setMute(true);
            }

            console.log(call[0].CallbackNumber);
            setMute(true);
            if (!LEAVE_CAMERA_ON) {
                xapi.Command.Video.Input.MainVideo.Mute();
                }
            xapi.Command.Video.Layout.LayoutFamily.Set({ CustomLayoutName: 'value', LayoutFamily: 'overlay', Target: 'Local'});
            xapi.Command.Video.Selfview.Set({ Mode: 'off'});
            xapi.Command.Video.PresentationPIP.Set({ Position: 'UpperRight'});
            xapi.Command.Video.PresentationView.Set({ View: 'Maximized'});
            inCall=true;
            if (storedPostDialKeys!='')
            {
                xapi.Command.Call.DTMFSend({ DTMFString: storedPostDialKeys });
                storedPostDialKeys='';
            }
        }
    });
    xapi.Event.CallDisconnect.on(() => {
        if (inCompanionMode) {
            setMute(true);
            inCall=false;
        }
    });
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
    if (inCompanionMode) {
     if (volume > MAX_VOLUME) {
        setVolume(MAX_VOLUME);
        alert(
            'Volume restricted',
            'Max volume on this video system is restricted by a script',
            );
        }
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
        var destSplit=destination.split(':')
        if (destSplit.length==1)
            xapi.Command.Dial({Number: destination});
        else if (destSplit[0]=='wbxmn')
            xapi.Command.Webex.Join({  Number: destSplit[1] });
        else 
            console.log('Not a valid destination: ',destination)
    }
    else
    {
        console.log('No destination to dial received from main codec, set PREFER_JOIN_OBTP to true if you wish to just dial scheduled meeting.')
    }
}


function companionDeviceShowJoin(destination)
{
    if (destination!='') {
        storedDestination=destination;
        // Activate panel custom join panel button
        xapi.Command.UserInterface.Extensions.Panel.Update(
            { PanelId: BTN_MANUAL_JOIN, Visibility: 'Auto' });

    }
    else
    {
        console.log('No destination to dial received from main codec, custom Join button not shown.')
    }
}

function processTriggeringKeypress(destination)
{
    if (inCall)
    {
        xapi.Command.Call.DTMFSend({ DTMFString: destination });
    }
    else
    {
        storedPostDialKeys+=destination;
    }
}

function handlePanelButtonClicked(event) {
        if(event.PanelId == BTN_MANUAL_JOIN){
            if (storedDestination!='') {
                var destSplit=storedDestination.split(':')
                if (destSplit.length==1)
                    xapi.Command.Dial({Number: storedDestination});
                else if (destSplit[0]=='wbxmn')
                    xapi.Command.Webex.Join({  Number: destSplit[1] });
                else 
                    console.log('Not a valid destination: ',storedDestination)
            }
        }
        if(event.PanelId == BTN_TOGGLE) {
            console.log('BTN_TOGGLE pressed');
            if (inCompanionMode){
                console.log("In companion mode, toggling...")
                inCompanionMode=false;
                installOnButton();
                setVolume(originalVolume);
            }
            else {
                console.log("In regular mode, turning on companion...")
                storeOriginalVolume();
                checkInitialVolume();

                inCompanionMode=true;
                 if (MANUAL_TOGGLE_FUNC) {
                        installOffButton();
                    }
            }
        }
}

function companionDeviceDisconnect()
{
    xapi.Command.Call.Disconnect();
    storedDestination='';
    // Hide custom join panel button
    xapi.Command.UserInterface.Extensions.Panel.Update(
            { PanelId: BTN_MANUAL_JOIN, Visibility: 'Hidden' });
}

async function storeOriginalVolume() {
        try {
            originalVolume = await xapi.Status.Audio.Volume.get();
        }
        catch (error) {
            console.error(error);
        }
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
            if (eventSplit.length == 3) {
              theProtocol=eventSplit[1];
              destination=eventSplit[2];
            } else if (eventSplit.length == 4)
            {
                theProtocol=eventSplit[1];
                // this is to handle when we get instruction to join
                // a webex meeting with the meeting ID as destination
                destination=eventSplit[2]+':'+eventSplit[3];
            }
            else
            {
              destination=eventSplit[1];
            }
        }

  switch(parsedCommand) {

    case "JoinMeeting":
      companionDeviceJoin(destination);
      break;
    case "ShowJoinMeeting":
      companionDeviceShowJoin(destination);
      break;
    case "DisconnectMeeting":
      companionDeviceDisconnect();
      break;
    case "Keypress":
      processTriggeringKeypress(destination);
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

    storeOriginalVolume();
    listenToCalls();
    xapi.Status.Audio.Volume.on((volume) => {
        //console.log('Volume changed to: ${volume}');
        limitVolume(volume);
        });
    checkInitialVolume();
    if (MANUAL_TOGGLE_FUNC) {
        installOffButton();
    }
    xapi.event.on('UserInterface Extensions Panel Clicked', (event) =>
                            handlePanelButtonClicked(event));
    xapi.Command.UserInterface.Extensions.Panel.Update(
            { PanelId: BTN_MANUAL_JOIN, Visibility: 'Hidden' });



}


init();