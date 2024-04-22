# GVE DevNet Webex Board Companion Mode Alternative Macro
Macro to emulate companion mode for a Webex Board optionally working in conjunction with another Webex Device (i.e. Room Kit Plus) in the same 
room when wanting to join both devices to a meeting using VIMT (CVI Cloud Gateway) so that the Board joins only to show content for the meeting 
and also be used as a whiteboard. This Macro also emulates companion mode on the Webex Board Pro series devices where the official "Companion Mode" 
feature is not supported as you can see in this [Webex Help Center article](https://help.webex.com/en-us/article/fd1jm/Companion-mode-for-Board-and-Room-Series-devices). 

## Contacts
* Gerardo Chaves (gchaves@cisco.com)
* Gianfranco Gonzales Vargas (giagonza@cisco.com)
* Sandeep Bhasin (sanbhasi@cisco.com)
* Bobby McGonigle (bomcgoni@cisco.com)

## Solution Components
* Webex Collaboration Devices
* Javascript
* xAPI

## Requirements
1. Cisco Webex Board
2. Optional: triggering Cisco Webex Room Device (Room, Codec or Desk Series)
3. Firmware CE9 or newer

## Installation/Configuration

1) Load and activate the Javascript code included in the the **CompanionModeEmulator.js** file in this repository into a new Macro in the Macro editor of the Cisco Webex Board you want to simulate Companion mode when working with a Room Kit Plus using CVI Cloud Gateway.  
If you would like the Webex Board to simply join the same meeting that the triggering Webex Device is joining instead of whatever meeting is showing up in the board 
as currently scheduled for the Board to join, edit **CompanionModeEmulator.js** on your device and set the `PREFER_JOIN_OBTP` constant to false:  
`const PREFER_JOIN_OBTP=false`  
This will cause Board the use the destination sent to it by the triggering device to dial into the meeting.  
NOTE: If the destination is not a meeting bridge but rather an individual device and you have set `PREFER_JOIN_OBTP` to `false`, that device will then receive 2 separate calls, one from the triggering device and another from the Board  
Also change these constants if needed:  
`LEAVE_CAMERA_ON` can be used to have the Board leave the camera on when joining a meeting. Default setting is false assuming you prefer to use the camera 
on the main device in the room being used to join the meeting  
`MANUAL_TOGGLE_FUNC` will automatically add a new panel button to the board so you can toggle the functionality of this macro on or off. By default, 
it is set to *true* , but if you set it to *false* the new panel button will never be added and as long as the macro is on it will restrict the audio 
and video of the Board for each call.  

2) Load the Javascript code included in the  **TriggerCompanionJoin.js** file in this repository into a new Macro in the Macro editor of the Cisco Webex Device (i.e. Room Kit Plus using CVI Cloud Gateway). This script 
will tell the board to join the meeting that the triggering device is in. If you have left the PREFER_JOIN_OBTP constant set to 'true' then the board will join the meeting being offered on the screen with OBTP as soon as a call is connected in this device, 
   otherwise it will use the destination sent by the triggering device to dial into the meeting. 
   It will also tell the board to disconnect from the call when the Room Kit Plus disconnects from the meeting/call.  
   Before activating the macro, set the following constants in the code on your device:  
   
`COMPANION_IP`: IP address or hostname of associated board to send join/disconnect commands to
`COMPANION_ADDRESS`: Webex address of user associated with board to send join/disconnect commands to on *instant meeting*
`COMPANION_USERNAME`: username of account with admin priviledges on board to be able to send commands  
`COMPANION_PASSWORD`: password of account with admin priviledges on board to be able to send commands  
`INSTANT_MEETING_JOIN_COMMAND_SEND_DELAY`: estimated delay value in *milliseconds* that needs to be waited for background applicaton to process,i.e before sending information to companion device
`AUTOMATIC_CONNECT`: Leave true if you would like the macro to send a command to the board to join whenever a call connects on this device. 
Set to 'false' if you want to invoke that using a custom panel button which is always an option irrespective of this setting 
if it is properly configured in the UI extensions editor.  
`MANAGE_KEYPAD`: Leave it as *true* to allow the macro to replace the standard numeric keypad with a custom panel so it can capture any keypresses 
when entering meeting IDs or PINs to be able to relay them to the Board. If you do not anticipate joining meetings using this method and 
would prefer to have the original keypad on the device, set MANAGE_KEYPAD to *false*  
`AUTOKEYPADURIS`: This constant array contains objects that determine if the macro should automatically show the custom keypad panel (if enabled by MANAGE_KEYPAD ) 
for certain domains that require further input for to enter a meeting ID and, optionally, a passkey. You can always invoke the custom keypad manually 
even if your target system is not covered in that array. Each object of the array contains a value with key "suffix:" which is the domain name of the URI you dial to join 
the conferencing system and a value with key "numSkip:" which is a boolean (true or false) that specifies if it should skip showing the custom 
keypad if the entire URI is prefixed by a numeric meeting ID (i.e. 1234567890.bbxo@m.webex.com or 1234567890@m.webex.com) in which case that conferencing 
system does not require further input to connect to the meeting.  
`DIMISS_BIG_PAD_TIME`: This is the amount of time in milliseconds that will take the custom panel keypad to automatically be dismissed 
after the last key has been pressed on it. The default is set to 30000 or 30 seconds  
`DISMISS_BIG_PAD_ON_POUND`: If this value is set to true, the custom panel keypad will automatically be dismissed when you press the '#' key. 
The default value is set to true   


3) Load the custom panel button included in the **ConnectBoardPanelButton_forTriggeringDevice.xml** file by importing it into the 
triggering device codec using it's UI Extension Editor. This panel button will only show up while in a call.    

4) If you wish to have the custom "Join Board" button also show on the Webex Board to join manually from there (when not in automatic mode), then load the custom panel 
button included in the **ConnectBoardPanelButton_forBoard.xml** file by importing it into the 
Webex Board using it's UI Extension Editor. This panel button will only show up when not in a call and only when the triggering device is in a call.  
   If you are unfamiliar with UI Extensions and how to load them from the devices 
   web interface, visit this article: https://help.webex.com/en-us/n18glho/User-Interface-Extensions-with-Room-and-Desk-Devices-and-Webex-Boards . 
   You can find more details and screenshots also in this guide: https://www.cisco.com/c/dam/en/us/td/docs/telepresence/endpoint/roomos-103/desk-room-kit-boards-customization-guide-roomos-103.pdf
 
5) Activate the macros on both devices.   

Here are instructions on how to configure local user accounts on Webex Devices, including the Webex Boards: https://help.webex.com/en-us/jkhs20/Local-User-Administration-on-Room-and-Desk-Devices  
IMPORTANT: both the Webex device joining the meeting and the Webex Board must be on the same network so that the controlling device can reach the board via HTTP without going 
through a firewall.  

If you are unfamiliar with Cisco Room device macros, this is a good article to get started:
https://help.webex.com/en-us/np8b6m6/Use-of-Macros-with-Room-and-Desk-Devices-and-Webex-Boards

NOTE: If you receive errors such as "URL not allowed by rule" when running the macro on the triggering device it is likely that the host (Webex Board) is not reachable.    
There are many tips on troubleshooting HTTP connectivity problems in Webex Devices here: https://community.cisco.com/t5/collaboration-voice-and-video/ce9-6-x-ce9-8-x-in-room-control-and-macros-usb-input-devices/ba-p/3765081
One common issue is that the device might already have a "whitelist" of IP addresses that it can connect to. You can check for this with the following command:
```xCommand HttpClient Allow Hostname List```  
If it is not empty, you can clear it with this command:  
```xCommand HttpClient Allow Hostname Clear```  
Or you can just add the IP address of the board onto the whitelist on the triggering device following the suggestions in the article above.

## Usage

Once active, the macro on the Webex Board will monitor any events that indicates it is in call and, if so, it will disable the camera and microphone (mute), lower the speaker volume to the minimum (off) and change the layout so that only the content or whiteboard being shared in the meeting is displayed.  
It will also listen for messages from the triggering device to join a meeting either by dialing the destination sent by the triggering device, or just joining the meeting that it is 
scheduled to join at the moment (configurable via the PREFER_JOIN_OBTP constant variable on the Board Macro). It will also listen for messages that tell it to 
display the custom "Connect Board" panel button when the triggering device is in a call so that users can join the board manually from the board itself.  

On the triggering device side, depending on configuration as per point 2 in config section above, it will automatically send a message to the Board 
instructing it to join the meeting via destination sent or to the scheduled meeting it is showing on the board. The user can always manually join the Board 
while in a call on the triggering device by touching the "Connect Board" custom panel button on either device. 

## Additional Information
##### XAPI

Documentation for the XAPI can be found in the [Command References overview](https://www.cisco.com/c/en/us/support/collaboration-endpoints/telepresence-quick-set-series/products-command-reference-list.html).


### LICENSE

Provided under Cisco Sample Code License, for details see [LICENSE](LICENSE.md)

### CODE_OF_CONDUCT

Our code of conduct is available [here](CODE_OF_CONDUCT.md)

### CONTRIBUTING

See our contributing guidelines [here](CONTRIBUTING.md)

#### DISCLAIMER:
<b>Please note:</b> This script is meant for demo purposes only. All tools/ scripts in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.
You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.