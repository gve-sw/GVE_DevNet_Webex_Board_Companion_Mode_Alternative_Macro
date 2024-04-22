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
const COMPANION_IP = ''; // IP address or hostname of associated board to send join/disconnect commands to
const COMPANION_ADDRESS = '' // Dialable destination of the associated board to use to add when an instant meeting is started
const INSTANT_MEETING_JOIN_COMMAND_SEND_DELAY = 5000; // This delay allow time for the actual adding of the companion to the instant meeting to take effect
const COMPANION_USERNAME = 'username'; // username of account with admin priviledges on board to be able to send commands
const COMPANION_PASSWORD = 'password'; // password of account with admin priviledges on board to be able to send commands
const AUTOMATIC_CONNECT = true; // Leave 'true' if you would like the macro to send a command to the board to join whenever a call
// connects on this device. Set to 'false' if you want to invoke that using the custom panel button
// (custom panel button is always an option irrespective of this setting if it is properly configured in the UI extensions editor)

const MANAGE_KEYPAD = true // Leave true to allow the macro to replace the standard numeric keypad with a custom panel
// so it can capture any keypresses when entering meeting IDs or PINs to be able to relay them
// to the Board. If you do not anticipate joining meetings using this method and would prefer to
// have the original keypad on the device, set MANAGE_KEYPAD to false

// edit AUTOKEYPADURIS below if you need to add more conferencing systems for which you would like the customer keypad
// controlled by the MANAGE_KEYPAD constant to appear automatically to prompt for a meeting ID and, optionally, a passkey
// You can always invoke the custom keypad manually even if your target system is not covered here.
// the suffix: value is the domain name of the URI you dial to join the conferencing system
// the numSkip: value is a boolean (true or false) that specifies if it should skip showing the custom keypad if the entire URI
// is prefixed by a numeric meeting ID (i.e. 1234567890.bbxo@m.webex.com or 1234567890@m.webex.com)
const AUTOKEYPADURIS = [
  { suffix: 'm.webex.com', numSkip: true },
  { suffix: 'bjn.vc', numSkip: false }
]

const DIMISS_BIG_PAD_TIME = 30000; //30 seconds

const DISMISS_BIG_PAD_ON_POUND = true;


var callDestination = '';
const BTN_MANUAL_JOIN = 'panel_manual_board_join'

let DismissBigPadTimer = null;

function sendCompanionDevice(message) {
  let url = 'https://' + COMPANION_IP + '/putxml';
  let headers = [
    'Content-Type: text/xml',
    `Authorization: Basic ${btoa(COMPANION_USERNAME + ':' + COMPANION_PASSWORD)}`
  ];

  let payload = "<Command><Message><Send><Text>" + message + "</Text></Send></Message></Command>";

  xapi.command('HttpClient Post', { Url: url, Header: headers, AllowInsecureHTTPS: 'True' }, payload)
    .then((response) => { if (response.StatusCode === "200") { console.log("Successfully sent: " + payload) } });
}

async function sendCompanionDeviceJoin() {
  if (callDestination == 'spark:instant-meeting' && COMPANION_ADDRESS != '') {
    xapi.Command.Conference.Participant.Add({ Number: COMPANION_ADDRESS });
    const theConference = await xapi.Status.Conference.get()
    const inviteLink = theConference.Call[0].Webex.MeetingInviteLink;
    console.log(`status conf call invitelink:`, inviteLink)
    setTimeout(function () { sendCompanionDevice("JoinMeeting:" + callDestination + '|' + inviteLink) }, INSTANT_MEETING_JOIN_COMMAND_SEND_DELAY);
  }
  else
    sendCompanionDevice("JoinMeeting:" + callDestination);
}

function sendCompanionDeviceShowJoin() {
  sendCompanionDevice("ShowJoinMeeting:" + callDestination);
  if (callDestination == 'spark:instant-meeting' && COMPANION_ADDRESS != '')
    xapi.Command.Conference.Participant.Add({ Number: COMPANION_ADDRESS });
}

function sendCompanionDeviceDisconnect() {
  sendCompanionDevice("DisconnectMeeting");
}

function handlePanelButtonClicked(event) {
  if (event.PanelId == BTN_MANUAL_JOIN) {
    sendCompanionDeviceJoin();
  }
}


function popKeyPad(destination) {
  let result = false;
  let justURI = destination.substring(destination.lastIndexOf(":") + 1);
  console.log(justURI)
  let domain = justURI.substring(justURI.lastIndexOf("@") + 1);
  let address = justURI.substring(0, justURI.lastIndexOf("@"));
  for (const checkURI of AUTOKEYPADURIS) {
    if (checkURI.suffix == domain) {
      if (checkURI.numSkip) {
        let dotIndex = address.lastIndexOf(".");
        let front = ''
        if (dotIndex > 0) {
          front = address.substring(0, dotIndex);
        }
        else {
          front = address;
        }
        if (/^[0-9]+$/.test(front) == false) {
          result = true;
        }
      }
      else {
        result = true;
      }
      break;
    }
  }
  return result;
}

function listenToCalls() {
  xapi.event.on('UserInterface Extensions Panel Clicked', (event) =>
    handlePanelButtonClicked(event));


  xapi.Event.OutgoingCallIndication.on(async () => {
    const call = await xapi.Status.Call.get();
    console.log(call);
    callDestination = call[0].CallbackNumber;
  });

  xapi.Event.CallSuccessful.on(async () => {
    const call = await xapi.Status.Call.get();
    var theDestination = call[0].CallbackNumber;
    console.log("Connected call to/from: ", theDestination);
    console.log("Destination captured upon outbound event: ", callDestination)
    if (MANAGE_KEYPAD) {
      if (popKeyPad(callDestination)) {
        xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: 'xtraBig_Keypad' });
      }
    }
    // only connect automatically if flag set
    if (AUTOMATIC_CONNECT) {
      console.log("Auto-connect enabled, send command to board...")
      sendCompanionDeviceJoin();
    }
    else {
      sendCompanionDeviceShowJoin();
    }

  });

  xapi.Event.CallDisconnect.on(async () => {
    const call = await xapi.Status.Call.get();

    console.log("Call disconnected orig destination ", callDestination, " disconnect callbacknumber ", call[0].CallbackNumber);
    callDestination = '';
    sendCompanionDeviceDisconnect();

  });

  xapi.Event.UserInterface.Extensions.Widget.Action.on(event => {
    switch (event.Type) {
      case 'released':
        switch (event.WidgetId) {
          case 'xtraBig_Keypad':
            xapi.Command.Call.DTMFSend({ DTMFString: event.Value })
            xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'xtraBig_Keypad' })
            console.log({ Message: `DTMF Send: ${event.Value}` })
            sendCompanionDevice("Keypress:" + event.Value);
            console.log(`Sent to board: Keypress:${event.Value}`)
            if (DISMISS_BIG_PAD_ON_POUND && event.Value == '#') {
              xapi.Command.UserInterface.Extensions.Panel.Close();
            }
            else {
              restartDismissBigPadTimer();
            }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  })

}



function startDismissBigPadTimer() {
  if (DismissBigPadTimer == null) {
    DismissBigPadTimer = setTimeout(onDismissBigPadTimerExpired, DIMISS_BIG_PAD_TIME);
  }
}

function stopDismissBigPadTimer() {
  if (DismissBigPadTimer != null) {
    clearTimeout(DismissBigPadTimer);
    DismissBigPadTimer = null;
  }
}

function restartDismissBigPadTimer() {
  stopDismissBigPadTimer();
  startDismissBigPadTimer();
}

function onDismissBigPadTimerExpired() {
  console.log('onDismissBigPadTimerExpired');
  xapi.Command.UserInterface.Extensions.Panel.Close();
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

  if (COMPANION_IP != '') {
    listenToCalls();
    if (MANAGE_KEYPAD) {
      xapi.Config.UserInterface.Features.Call.Keypad.set('Hidden')
      xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: 'xtraBig_Keypad' }, `<Extensions><Panel><Order>1</Order><Origin>local</Origin><Type>InCall</Type><Icon>Custom</Icon><Name>Keypad</Name><ActivityType>Custom</ActivityType><CustomIcon><Content>iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAAAXNSR0IArs4c6QAAAvdJREFUeF7tnMFt3EAMRTkt5GYjPaSFtOEU4iJcSNJGWnAPQXJLCzIW2MNikQUhQPziZ96eRyT13lAaATO7gp81gWVdPcUHAs0nAQIRaE7AvHw6EIHmBMzLpwMRaE7AvHw6EIHmBMzLpwMRmBPYtu1zRLxFxNfr6J8R8brW+pVfvX/E9Hy3RMo78ArzPSI+3an4GxFfjpY4Pd/9dFYI/B4RLw/66Mda69v+Hnt8xbZto/OdIfB3RDw9QP5nrfV8sMDR+RBoPmHOEDj6kaZ+ZJ8h8LICZRFz5HviJlb5IuaSa/qyXn1/0s+IoolH2CsBSQdCu44AAuvYSiIjUIK5LgkC69hKIiNQgrkuCQLr2EoiI1CCuS4JAuvYSiIjUIK5LgkC69hKIiNQgrkuCQLr2EoiI1CCuS4JAuvYSiIjUIK5LgkC69hKIiNQgrkuCQLr2EoiI1CCuS6JRKB608/0fLfToVzg9LMK6vu772WFQDb21j1B6//oZ9u20WcV1Pd3Rgci0LwDeYSaC+RshLPAS+3Tl/Xq+5N+RhROPkJH1K9CoVxLoPw7sLZ8oiPQfA4gEIHmBMzLpwMRaE7AvHw6EIHmBMzLpwMRaE7AvHw6EIHmBMzLpwMRaE7AvHw6EIHmBMzLpwMRaE7AvHxJB6o3/UzPJ93UpD47MD3f/QOjvAPVfwo+Pd8ZAtlaX/ieVXQgAs0FcjbCXCBnI5wFXmqfvqxX35/0M6Jw8hGasxH+c6B8FeqPqPcdILC3n7Q6BKaIeg9AYG8/aXUITBH1HoDA3n7S6hCYIuo9AIG9/aTVITBF1HsAAnv7SatDYIqo9wAE9vaTVofAFFHvAQjs7SetDoEpot4DENjbT1odAlNEvQcgsLeftLqRAs/cZJQSP3jAOIHqsxEH+9gdbqJA6Ubi3cQPvmCiQOlW/oN97A6HwN3Iel0wUSCP0F5zbF81LGL28Wo5ms+Illoo6l8Exr0D/zfNCDQ3jkAEmhMwL58ORKA5AfPy6UBzgR/JbriA4q1GzQAAAABJRU5ErkJggg==</Content><Id>dc52228499a2c14f6b0290602260a4e3e85c7a81de3a46566d136bca517f6aab</Id></CustomIcon><Page><Name>Keypad</Name><Row><Name>Row</Name><Widget><WidgetId>xtraBig_Keypad</WidgetId><Type>GroupButton</Type><Options>size=4;columns=3</Options><ValueSpace><Value><Key>1</Key><Name>1</Name></Value><Value><Key>2</Key><Name>2</Name></Value><Value><Key>3</Key><Name>3</Name></Value><Value><Key>4</Key><Name>4</Name></Value><Value><Key>5</Key><Name>5</Name></Value><Value><Key>6</Key><Name>6</Name></Value><Value><Key>7</Key><Name>7</Name></Value><Value><Key>8</Key><Name>8</Name></Value><Value><Key>9</Key><Name>9</Name></Value><Value><Key>#</Key><Name>#</Name></Value><Value><Key>0</Key><Name>0</Name></Value><Value><Key>*</Key><Name>✱</Name></Value></ValueSpace></Widget></Row><Options>hideRowNames=1</Options></Page></Panel></Extensions> `)
      console.info({ Message: 'Extra Big Keypad Installed and the Native Call Keypad was set to Hidden' })

      xapi.Event.Macros.Macro.Deactivated.on(event => {
        if (event.Name == module.name.replace('./', '')) {
          xapi.Config.UserInterface.Features.Call.Keypad.set('Auto')
          xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'xtraBig_Keypad' })
          console.info({ Message: 'Extra Big Keypad Uninstalled and the Native Call Keypad was set to Auto' })
        }
      });

    }
  }
}


init();