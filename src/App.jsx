import { useEffect, useState } from "react";
import { useLovense } from "./useLovense";
import * as Sharkey from "misskey-js";
import "./App.css";
import { useLoopingTimer } from "./useLoopingTimer";

const envVars = {
  envApiToken: import.meta.env.VITE_LOVENSE_API_TOKEN,
  envPlatform: import.meta.env.VITE_LOVENSE_APPID,
  envUsername: import.meta.env.VITE_LOVENSE_USERNAME,
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
  const [lovenseApiToken, setLovenseApiToken] = useState(envVars.envApiToken);
  const [lovensePlatform, setLovensePlatform] = useState(envVars.envPlatform);
  const [lovenseUsername, setLovenseUsername] = useState(envVars.envUsername);
  const [lovenseLoading, setLovenseLoading] = useState(false);
  const {
    initLovense,
    getQrCode,
    sendVibes,
    stopVibes,
    apiReadyStatus,
    connected,
    deviceInfo,
    toyList,
    qrCodeUrl,
    instance,
  } = useLovense({
    onReady: () => {
      setLovenseLoading(false);
    },
    onError: () => {
      setLovenseLoading(false);
    },
    onConnectionChange: () => {
      setLovenseLoading(false);
    },
  });

  const [sharkeyStream, setSharkeyStream] = useState(null);
  // const [notifications, setNotifications] = useState([]);
  const [newNotifiations, setNewNotifications] = useState([]);
  const [vibeTimer, setVibeTimer] = useState(0);
  const [vibing, setVibing] = useState(false);

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
        return [...prev, notification]
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
  useEffect(() => {
    console.dir(sharkeyStream?.state);
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

  const handleInitLovense = () => {
    setLovenseLoading(true);
    initLovense(lovenseApiToken, lovensePlatform, lovenseUsername);
  };
  const handleGetQrCode = () => {
    getQrCode();
  };
  const handleSendVibes = () => {
    setVibing(true);
    sendVibes && sendVibes(10);
  };
  const handleStopVibes = () => {
    setVibing(false);
    stopVibes && stopVibes();
  };

  useEffect(() => {
    if (connected) {
      if (!vibing && vibeTimer > 0) {
        handleSendVibes();
      } else if (vibing && vibeTimer === 0) {
        handleStopVibes();
      }
    }
  }, [vibeTimer]);

  return (
    <div className="appWrapper">
      <div className={!connected ? "flex column" : "hidden"}>
        <div className="flex column">
          <input
            id="lovenseApiToken"
            className="mb"
            type="text"
            value={lovenseApiToken}
            onChange={(e) => setLovenseApiToken(e.target.value)}
            placeholder="lovense developer token"
          />
          <input
            id="lovensePlatformId"
            className="mb"
            type="text"
            value={lovensePlatform}
            onChange={(e) => setLovensePlatform(e.target.value)}
            placeholder="lovense platform name"
          />
          <input
            id="lovenseUsername"
            className="mb"
            type="text"
            value={lovenseUsername}
            onChange={(e) => setLovenseUsername(e.target.value)}
            placeholder="lovense username"
          />
          <div className="flex row mb">
            <button
              id="lovenseInitApi"
              disabled={lovenseLoading}
              onClick={handleInitLovense}
            >
              Init Lovense API
            </button>
            <div className="ml">{apiReadyStatus ? "✔️" : "?"}</div>
          </div>
          <button
            id="lovenseGetQrCode"
            disabled={!apiReadyStatus}
            onClick={handleGetQrCode}
          >
            Get QR Code
          </button>
          <div id="qrHelpText" className="hidden">
            Scan QR Code from Lovense App
          </div>
          <p>
            {qrCodeUrl && <img id="lovenseQrCode" src={qrCodeUrl} alt="" />}
          </p>
        </div>
      </div>
      <div id="infoBox">
        <div id="appConnectionStatus" className="mt">
          {connected === true ? "Connected" : "Not Connected"}
        </div>
        <button
          id="sendVibes"
          disabled={!connected || lovenseLoading}
          onClick={handleSendVibes}
        >
          Send Vibes
        </button>
        <button
          id="stopVibes"
          className="ml"
          disabled={!connected || lovenseLoading}
          onClick={handleStopVibes}
        >
          Stop Vibes
        </button>
        <div>{vibeTimer}</div>
      </div>
    </div>
  );
}

export default App;
