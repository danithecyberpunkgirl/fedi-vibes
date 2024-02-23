import { useEffect, useState } from "react";
import { useLovense } from "./useLovense";
import * as Sharkey from "misskey-js";
import "./App.css";

function App() {
  const [lovenseApiToken, setLovenseApiToken] = useState(
    import.meta.env.VITE_LOVENSE_API_TOKEN
  );
  const [lovensePlatform, setLovensePlatform] = useState(
    import.meta.env.VITE_LOVENSE_APPID
  );
  const [lovenseUsername, setLovenseUsername] = useState(
    import.meta.env.VITE_LOVENSE_USERNAME
  );
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
    onAuthSuccess: () => {},
    onReady: () => {
      setLovenseLoading(false);
    },
    onError: () => {
      setLovenseLoading(false);
    },
    onToyInfo: () => {},
    onDeviceInfo: () => {},
    onConnectionChange: () => {
      setLovenseLoading(false);
    },
  });

  const [sharkeyApi, setSharkeyApi] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [vibeTimer, setVibeTimer] = useState(0);
  const [notifPollingCooldown, setNotifPollingCooldown] = useState(0);
  useEffect(() => {
    // A whole bunch of bullshit I tried to get streaming to work
    // const stream = new Sharkey.Stream('https://transfem.social', { token: import.meta.env.VITE_TRANSFEM_SOCIAL_API_TOKEN });
    // const mainChannel = stream.useChannel('main');
    // mainChannel.on('notification', notification => {
    //   console.log('notification received', notification);
    // });
    // mainChannel.on('_connected_', () => {
    //   console.dir('connected');
    // });
    setSharkeyApi(
      new Sharkey.api.APIClient({
        origin: "https://transfem.social",
        credential: import.meta.env.VITE_TRANSFEM_SOCIAL_API_TOKEN,
      })
    );
  }, []);

  const handleInitLovense = () => {
    setLovenseLoading(true);
    initLovense(lovenseApiToken, lovensePlatform, lovenseUsername);
  };
  const handleGetQrCode = () => {
    getQrCode();
  };
  const handleSendVibes = () => {
    sendVibes(10);
  };
  const handleStopVibes = () => {
    stopVibes && stopVibes();
  };

  const [requestingNotifs, setRequestingNotifs] = useState(false);
  const pollNotifications = () => {
    const limit = 10;
    setRequestingNotifs(true);
    sharkeyApi
      .request("i/notifications", {
        limit: limit,
      })
      .then((newNotifications) => {
        const shiftedIndex =
          notifications.length > 0
            ? newNotifications.findIndex((notif) => {
                return notif.id === notifications?.[0]?.id;
              })
            : 0;
        if (shiftedIndex > 0) {
          console.dir(`${shiftedIndex} notifications received`);
        }
        if (shiftedIndex === -1) {
          console.dir("rate limited");
          if (vibeTimer <= 0) {
            handleSendVibes();
          }
          setVibeTimer(vibeTimer + limit);
        } else if (shiftedIndex > 0) {
          if (vibeTimer <= 0) {
            handleSendVibes();
          }
          setVibeTimer(vibeTimer + shiftedIndex);
        }
        setNotifications(newNotifications);
        setRequestingNotifs(false);
      });
  };

  useEffect(() => {
    if (vibeTimer <= 0) {
      setVibeTimer(0);
      handleStopVibes();
    } else {
      const timeoutRef = setTimeout(() => {
        setVibeTimer(vibeTimer - 1);
      }, 1000);
      return () => clearTimeout(timeoutRef);
    }
  }, [vibeTimer]);

  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      setNotifPollingCooldown((notifPollingCooldown + 1) % 5);
    }, 1000);
    return () => clearTimeout(timeoutRef);
  }, [notifPollingCooldown]);
  useEffect(() => {
    if (sharkeyApi && notifPollingCooldown === 0) {
      setNotifPollingCooldown((notifPollingCooldown + 1) % 5);
      pollNotifications();
    }
  }, [notifPollingCooldown, pollNotifications, sharkeyApi]);
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
