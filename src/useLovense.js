import { useState, useCallback } from "react";
import axios from "axios";

export const useLovense = ({
  onAuthSuccess = () => {},
  onReady = () => {},
  onError = () => {},
  onToyInfo = () => {},
  onDeviceInfo = () => {},
  onConnectionChange = () => {},
}) => {
  let [sdkInstance, setSdkInstance] = useState();

  //user info
  let [platform, setPlatform] = useState();
  let [username, setUsername] = useState();
  let [uid, setUid] = useState("");

  //tokens
  let [apiToken, setApiToken] = useState();
  let [authToken, setAuthToken] = useState();

  //status
  let [apiReadyStatus, setApiReadyStatus] = useState(false);
  let [connected, setConnected] = useState(false);

  //Info from lovense
  let [deviceInfo, setDeviceInfo] = useState({});
  let [toyList, setToyList] = useState([]);
  let [qrCodeUrl, setQrCodeUrl] = useState("");

  const setUserVars = (_token, _platform, _username, _uid = "123456") => {
    setApiToken(_token);
    setPlatform(_platform);
    setUsername(_username);
    setUid(_uid);
  };

  const getAuthToken = async (_token, _username, _uid) => {
    try {
      if (!_token || !_username) {
        throw new Error("invalid token or username");
      }
      const { data: resData } = await axios.post(
        "https://api.lovense-api.com/api/basicApi/getToken",
        {
          token: _token,
          uid: _uid,
          uname: _username,
        }
      );
      if (resData.code === 0) {
        setAuthToken(resData?.data?.authToken ?? "");
        onAuthSuccess(resData?.data?.authToken);
        return resData?.data?.authToken;
      } else {
        throw new Error(resData.message);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const initLovense = async (_token, _platform, _username, _uid = "123456") => {
    setUserVars(_token, _platform, _username, _uid);
    const authTokenResult = await getAuthToken(_token, _username, _uid);
    if (!authTokenResult) return;
    try {
      if (sdkInstance) {
        sdkInstance.destroy();
        setApiReadyStatus(false);
        setConnected(false);
      }
      const createdInstance = new LovenseBasicSdk({
        platform: _platform,
        authToken: authTokenResult,
        uid: _uid,
      });
      setSdkInstance(createdInstance);
      createdInstance.on("ready", (instance) => {
        setApiReadyStatus(true);
        onReady(instance);
      });
      createdInstance.on("sdkError", (data) => {
        console.error("sdk error", data.code, data.message);
        onError(data);
      });
      createdInstance.on("toyInfoChange", (data) => {
        setToyList(data);
        onToyInfo(data);
      });
      createdInstance.on("deviceInfoChange", (data) => {
        setDeviceInfo(data);
        onDeviceInfo(data);
      });
      createdInstance.on("appStatusChange", (data) => {
        setConnected(data);
        onConnectionChange(data);
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const getQrCode = useCallback(async () => {
    try {
      if (!apiReadyStatus) {
        throw new Error("Invalid initialization");
      }
      const codeRes = await sdkInstance.getQrcode();
      if (!codeRes.qrcodeUrl) {
        throw new Error("Invalid qrcode");
      }
      setQrCodeUrl(codeRes.qrcodeUrl);
    } catch (e) {
      alert(e.message);
    }
  }, [apiReadyStatus, sdkInstance]);

  const sendVibes = useCallback(
    async (intensity, lengthInSecs) => {
      try {
        await sdkInstance.sendToyCommand({
          toyId: toyList[0].id,
          vibrate: intensity,
          time: lengthInSecs,
        });
      } catch (e) {
        alert(e.message);
      }
    },
    [sdkInstance, toyList]
  );

  const stopVibes = useCallback(async () => {
    if (!sdkInstance) return;
    try {
      await sdkInstance.stopToyAction();
    } catch (e) {
      alert(e.message);
    }
  }, [sdkInstance]);

  return {
    setUserVars,
    initLovense,
    getQrCode,
    sendVibes,
    stopVibes,
    apiReadyStatus,
    connected,
    deviceInfo,
    toyList,
    qrCodeUrl,
    instance: sdkInstance,
  };
};
