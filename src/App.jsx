import { useState } from "react";
import { useLovense } from "./useLovense";
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

  const handleInitLovense = () => {
    setLovenseLoading(true);
    initLovense(lovenseApiToken, lovensePlatform, lovenseUsername);
  };
  const handleGetQrCode = () => {
    getQrCode();
  };
  const handleSendVibes = () => {
    sendVibes(10, 1);
  };
  const handleStopVibes = () => {
    stopVibes();
  };
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
          class="ml"
          disabled={!connected || lovenseLoading}
          onClick={handleStopVibes}
        >
          Stop Vibes
        </button>
      </div>
    </div>
  );
}

export default App;
