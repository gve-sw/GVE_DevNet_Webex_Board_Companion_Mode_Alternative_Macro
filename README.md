# GVE DevNet Webex Board Companion Mode Simulator Macro
Macro to simulate companion mode for a Webex board working in conjunction with a Room Kit Plus using CVI Cloud Gateway. 


## Contacts
* Gerardo Chaves (gchaves@cisco.com)
* Gianfranco Gonzales Vargas (giagonza@cisco.com)

## Solution Components
* Webex Collaboration Devices
* Javascript
* xAPI

## Requirements
1. Cisco Webex Room Device (Room, Board or Desk Series)
2. Firmware CE9 or newer

## Installation/Configuration

Load the Javascript code included in the the **CompanionModeEmulator.js** file in this repository into a new Macro in the Macro editor of the Cisco Webex Board you want to simulate Companion mode when working with a Room Kit Plus using CVI Cloud Gateway.  
   

If you are unfamiliar with Cisco Room device macros, this is a good article to get started:
https://help.webex.com/en-us/np8b6m6/Use-of-Macros-with-Room-and-Desk-Devices-and-Webex-Boards




## Usage

Once active, the macro will monitor any events that indicates it is in call and, if so, it will disable the camera and microphone (mute), lower the speaker volume to the minimum (off) and change the layout so that only the content or whiteboard being shared in the meeting is displayed.

## Additional Information
##### XAPI

Documentation for the XAPI can be found in the [Command References overview](https://www.cisco.com/c/en/us/support/collaboration-endpoints/telepresence-quick-set-series/products-command-reference-list.html).




# Screenshots



### LICENSE

Provided under Cisco Sample Code License, for details see [LICENSE](LICENSE.md)

### CODE_OF_CONDUCT

Our code of conduct is available [here](CODE_OF_CONDUCT.md)

### CONTRIBUTING

See our contributing guidelines [here](CONTRIBUTING.md)

#### DISCLAIMER:
<b>Please note:</b> This script is meant for demo purposes only. All tools/ scripts in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.
You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.