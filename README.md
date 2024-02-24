# FediVibes
A very dumb shitpost of an idea to turn activitypub notifications from transfem.social into vibrations on a lovense sex toy.

### Running
This project uses [buttplug.io](https://docs.buttplug.io) and [Intiface](https://docs.intiface.com/docs/intiface-central/quickstart/) to control your toy.

Grab an API token from your misskey/sharkey instance and put it in an `.env` file. I included an `.env.example` to help guide you. Put in the websocket URL for your Intiface server too.

Before starting the app, make sure you have a vibrating toy connected to Intiface.

You will need yarn. hopefull you can just run `yarn install` and `yarn start`. Then you should be able to open a browser window and if everything goes to plan your toy will vibrate for 1 second for every notification you recieve.