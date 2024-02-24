import { useState, useEffect } from "react";
import * as Buttplug from "buttplug";

export const useButtplug = (dt, serverUrl) => {
  const [bpClient, setBpClient] = useState(null);
  const [bpFoundDevice, setBpFoundDevice] = useState(false);
  const [selectedDevice, _setSelectedDevice] = useState(null);
  const [motorState, setMotorState] = useState([]);

  const setSelectedDevice = (device) => {
    if (selectedDevice && bpClient?.connected) {
      //this is async but we're switching devices so we don't care
      selectedDevice.stop();
    }
    _setSelectedDevice(device);
    const newMotorState = device.vibrateAttributes.map(() => ({
      intensity: 0,
      timer: 0,
      vibing: false,
    }));
    setMotorState(newMotorState);
  };
  useEffect(() => {
    let clientRef = { client: null };
    (async function () {
      try {
        clientRef.client = new Buttplug.ButtplugClient("FediVibes");
        clientRef.client.addListener("deviceadded", async (device) => {
          console.log(`Device Connected: ${device.name}`);
          console.log("Client currently knows about these devices:");
          clientRef.client.devices.forEach((device) =>
            console.log(`- ${device.name}`)
          );
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
          new Buttplug.ButtplugBrowserWebsocketClientConnector(serverUrl)
        );
        await clientRef.client.startScanning();
        setBpClient(clientRef.client);
      } catch (e) {
        //sometimes react re-mounts while the client is still connecting
        //error can be ignored
        if (e !== undefined) {
          console.error(e);
        }
      }
    })();
    return () => {
      if (clientRef && clientRef.client && clientRef.client.connected) {
        clientRef?.client?.stopScanning();
        clientRef?.client?.disconnect();
      }
    };
  }, []);

  const handleStopVibes = async () => {
    if (!bpClient?.connected) return;
    if (motorState.some((motor) => motor.vibing)) {
      motorState.forEach((motor) => {
        motor.intensity = 0;
        motor.timer = 0;
        motor.vibing = false;
      });
      try {
        await selectedDevice.stop();
        setMotorState(motorState);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateVibes = async (nextMotorState) => {
    if (!bpClient?.connected) return;
    nextMotorState.forEach((motor) => {
      if (motor.intensity > 0) {
        motor.vibing = true;
      } else {
        motor.vibing = false;
      }
    });
    try {
      await selectedDevice.vibrate(
        nextMotorState.map((motor) => motor.intensity)
      );
      setMotorState(nextMotorState);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (bpClient?.connected) {
      let shouldUpdateMotors = false;
      motorState.forEach((motor) => {
        if (!motor.vibing && motor.timer > 0) {
          shouldUpdateMotors = true;
        } else if (motor.vibing && motor.timer < 0.1) {
          motor.intensity = 0;
          shouldUpdateMotors = true;
        }
      });
      if (shouldUpdateMotors) {
        handleUpdateVibes(motorState);
      }
    }
  }, [dt]);

  return {
    bpClient,
    bpFoundDevice,
    devices: bpClient?.devices,
    motorState,
    setMotorState,
    selectedDevice,
    setSelectedDevice,
    handleStopVibes,
    handleUpdateVibes,
  };
};
