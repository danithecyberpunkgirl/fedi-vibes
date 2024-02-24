import { useEffect, useState } from "react";
import * as Sharkey from "misskey-js";
import * as Buttplug from "buttplug";
import { useLoopingTimer } from "./useLoopingTimer";
import "./App.css";

const envVars = {
  buttplugServerUrl: import.meta.env.VITE_BUTTPLUG_SERVER_URL,
  envTransfemToken: import.meta.env.VITE_TRANSFEM_SOCIAL_API_TOKEN,
};

// const notifTypes = [
//   "reaction",
//   "reply",
//   "followRequestAccepted",
//   "follow",
//   "pollEnded",
//   "mention",
//   "renote",
//   "achievementEarned",
// ];

function App() {
  const [dt] = useLoopingTimer();
  const [vibeTimer, setVibeTimer] = useState(0);
  const [vibing, setVibing] = useState(false);

  const [sharkeyStream, setSharkeyStream] = useState(null);
  const [sharkeyConnected, setSharkeyConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotifiations, setNewNotifications] = useState([]);
  useEffect(() => {
    const stream = new Sharkey.Stream("https://transfem.social", {
      token: envVars.envTransfemToken,
    });
    const mainChannel = stream.useChannel("main");
    mainChannel.on("notification", (notification) => {
      setNewNotifications((prev) => {
        if (prev.findIndex((n) => n.id === notification.id) > -1) {
          return prev;
        }
        return [...prev, notification];
      });
    });

    //temp testing with other's posts instead of notifications
    // const homeChannel = stream.useChannel("localTimeline");
    // homeChannel.on("note", (note) => {
    //   setNewNotifications((prev) => {
    //     if (prev.findIndex((n) => n.id === note.id) > -1) {
    //       return prev;
    //     }
    //     return [...prev, note]
    //   });
    // });
    setSharkeyStream(stream);
  }, []);

  const [bpClient, setBpClient] = useState(null);
  const [bpFoundDevice, setBpFoundDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  useEffect(() => {
    let clientRef = { client: null };
    (async function () {
      clientRef.client = new Buttplug.ButtplugClient("FediVibes");
      clientRef.client.addListener("deviceadded", async (device) => {
        console.log(`Device Connected: ${device.name}`);
        console.log("Client currently knows about these devices:");
        clientRef.client.devices.forEach((device) => console.log(`- ${device.name}`));
        // If we aren't working with a toy that vibrates, just return at this point.
        if (device.vibrateAttributes.length == 0) {
          console.dir("No vibration attributes found for device");
          return;
        }
        setBpFoundDevice(true);
        setSelectedDevice(device);
      });
      clientRef.client.addListener("deviceremoved", (device) => {
        console.log(`Device Removed: ${device.name}`);
        if (client.devices.length === 0) {
          setBpFoundDevice(false);
        }
      });
      await clientRef.client.connect(
        new Buttplug.ButtplugBrowserWebsocketClientConnector(
          envVars.buttplugServerUrl
        )
      );
      await clientRef.client.startScanning();
      setBpClient(clientRef.client);
    })();
    return () => {
      if (clientRef?.connected) {
        clientRef?.client?.stopScanning();
        clientRef?.client?.disconnect();
      }
    }
  }, []);

  const handleSendVibes = async () => {
    if (vibing) return;
    // how to count vibe motors and send seperate intensities
    // var vibratorCount = device.AllowedMessages[vibrateType].FeatureCount;
    // await device.SendVibrateCmd(new [] { 1.0, 0.0 });
    try {
      //ButtplugClientDevice
      await selectedDevice.vibrate(1.0);
      setVibing(true);
    } catch (e) {
      console.log(e);
    }
  };
  const handleStopVibes = async () => {
    if (!vibing) return;
    setVibing(false);
    await selectedDevice.stop();
  };

  useEffect(() => {
    if (sharkeyStream?.state === "connected") {
      setSharkeyConnected(true);
    } else {
      setSharkeyConnected(false);
    }
  }, [sharkeyStream?.state]);

  useEffect(() => {
    if (newNotifiations.length > 0) {
      // setNotifications((prev) => [...prev, ...newNotifiations]);
      setVibeTimer(vibeTimer + newNotifiations.length);
      setNewNotifications([]);
    } else if (vibeTimer > 0) {
      setVibeTimer(vibeTimer - 1);
    }
  }, [dt]);

  useEffect(() => {
    if (bpClient?.connected) {
      if (!vibing && vibeTimer > 0) {
        handleSendVibes();
      } else if (vibing && vibeTimer === 0) {
        handleStopVibes();
      }
    }
  }, [vibeTimer]);

  return (
    <div className="appWrapper">
      <div id="infoBox">
        <div id="appConnectionStatus" className="mt">
          {bpClient?.connected === true
            ? "Vibe Connected"
            : "Vibe Disconnected"}
        </div>
        <div id="sharkeyConnectionStatus" className="mt">
          {sharkeyConnected === true
            ? "Sharkey Connected"
            : "Sharkey Disconnected"}
        </div>
        <div className="mt">
          <button
            id="sendVibes"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={handleSendVibes}
          >
            Send Vibes
          </button>
          <button
            id="stopVibes"
            className="ml"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={handleStopVibes}
          >
            Stop Vibes
          </button>
        </div>
        <div className="mt">{vibeTimer}</div>
      </div>
    </div>
  );
}

export default App;
