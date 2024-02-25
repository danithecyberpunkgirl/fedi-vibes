import { useEffect, useState } from "react";
import { useLoopingTimer } from "./useLoopingTimer";
import { useSharkey } from "./useSharkey";
import { useButtplug } from "./useButtplug";
import { SettingsComponent } from "./Settings";
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
//   "quote",
//   "achievementEarned",
// ];

// const notifShape = {
//   id: "asdf",
//   note: { id: "asdfasdf", text: "asdfasdf" },
//   user: { id: "userId", username: "username" },
// };

const defaultNotifSettings = {
  reaction: {
    vibeIndex: 1,
    vibeIntensity: 0.5,
    secondsPerNotification: 0.5,
  },
  follow: {
    vibeIndex: "all",
    vibeIntensity: 1.0,
    secondsPerNotification: 5,
  },
  mention: {
    vibeIndex: 0,
    vibeIntensity: 0.6,
    secondsPerNotification: 1,
  },
  renote: {
    vibeIndex: 0,
    vibeIntensity: 0.5,
    secondsPerNotification: 2,
  },
  reply: {
    vibeIndex: "all",
    vibeIntensity: 1.0,
    secondsPerNotification: 2,
    fallbackType: "renote",
    minCharsToCount: 80,
  },
  quote: {
    vibeIndex: "all",
    vibeIntensity: 1.0,
    secondsPerNotification: 3,
    fallbackType: "renote",
    minCharsToCount: 80,
  },
  default: {
    vibeIndex: 1,
    vibeIntensity: 0.1,
    secondsPerNotification: 0.5,
  },
};

const globalSettings = {
  sameUserInLastTenNotifsForSpamFlag: 7,
  spammerCooldown: 10,
  maxIncreasePerTick: 5
};

const spamCooldown = {
  userId: { timer: 10, multiplier: 1 },
};

function App() {
  const [dt] = useLoopingTimer();
  const [notificationsLinked, setNotificationsLinked] = useState(false);
  const [settings, setSettings] = useState(defaultNotifSettings);
  const [spamCooldowns, setSpamCooldowns] = useState({});

  const {
    sharkeyConnected,
    notifications,
    setNotifications,
    clearNotifications,
    oldNotifications,
    setOldNotifications,
  } = useSharkey(envVars.envTransfemToken);

  const {
    bpClient,
    bpFoundDevice,
    devices,
    motorState,
    setMotorState,
    selectedDevice,
    setSelectedDevice,
    handleStopVibes,
  } = useButtplug(dt, envVars.buttplugServerUrl);

  useEffect(() => {
    if (notifications.length > 0 && notificationsLinked) {
      setOldNotifications((prev) => [...prev, ...notifications]);
      const maxTimerIncreaseForTick = motorState.map(motor => (motor.timer + globalSettings.maxIncreasePerTick));
      notifications
        .filter(
          (notif) =>
            !(
              notif.user &&
              spamCooldowns[notif.user.id] &&
              spamCooldowns[notif.user.id].timer > 0
            )
        )
        .forEach((notif) => {
          //get the last 10 notifications in the oldNotifications array
          let spamFlag = 0;
          oldNotifications.slice(-10).forEach((oldNotif) => {
            if (oldNotif?.user?.id === notif?.user?.id) {
              spamFlag++;
            }
          });
          if (spamFlag >= globalSettings.sameUserInLastTenNotifsForSpamFlag) {
            let spamUserObj = spamCooldowns[notif?.user?.id];
            spamCooldowns[notif?.user?.id] = {
              timer: spamUserObj
                ? spamUserObj.multiplier * globalSettings.spammerCooldown
                : globalSettings.spammerCooldown,
              multiplier: Math.min(
                5,
                spamUserObj ? spamUserObj.multiplier + 1 : 1
              ),
            };
            return;
          }
          let updateSettings = settings.default;
          if (settings[notif.type] !== undefined) {
            updateSettings = settings[notif.type];
          }
          if (
            updateSettings.fallbackType &&
            notif.note.text.length < updateSettings.minCharsToCount
          ) {
            updateSettings = settings[updateSettings.fallbackType]
              ? settings[updateSettings.fallbackType]
              : settings.default;
          }
          if (updateSettings.vibeIndex === "all") {
            motorState.forEach((motor) => {
              // console.dir(motor.intensity);
              motor.timer = motor.timer + updateSettings.secondsPerNotification;
              motor.intensity =
                updateSettings.vibeIntensity > motor.intensity
                  ? updateSettings.vibeIntensity
                  : motor.intensity;
            });
          } else {
            let thisMotor = motorState[updateSettings.vibeIndex];
            thisMotor.timer =
              thisMotor.timer + updateSettings.secondsPerNotification;
            thisMotor.intensity =
              updateSettings.vibeIntensity > thisMotor.intensity
                ? updateSettings.vibeIntensity
                : thisMotor.intensity;
              console.dir(thisMotor.intensity);
          }
        });
      motorState.forEach((motor, i) => {
        motor.timer = Math.min(motor.timer, maxTimerIncreaseForTick[i]);
      });
      setMotorState(motorState);
      clearNotifications();
    } else {
      motorState.forEach((motor) => {
        if (motor.timer > 0) {
          motor.timer = Math.max(0, motor.timer - 1);
        }
      });
      setMotorState(motorState);
    }
    let shouldUpdateSpamCooldowns = false;
    Object.values(spamCooldowns).forEach((cooldown) => {
      if (cooldown.timer > 0) {
        shouldUpdateSpamCooldowns = true;
        cooldown.timer = Math.max(0, cooldown.timer - 1);
      }
    });
    if (shouldUpdateSpamCooldowns) {
      setSpamCooldowns(spamCooldowns);
    }
  }, [dt]);

  const handleDummyNotif = () => {
    setNotifications((prev) => [
      ...prev,
      {
        id: `${Math.random()}`,
        type: "renote",
        note: {
          id: "asdf",
          text: "dummy",
        },
        user: {
          id: "asdf",
          username: 'testuser',
        }
      },
    ]);
  }

  return (
    <div className="appWrapper">
      <div id="infoBox" className="mx align-start flex column">
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
        <div id="notificationsLinked" className="mt">
          {notificationsLinked === true
            ? "Notifications == Vibes"
            : "Notifications =/= Vibes"}
        </div>
        <div className="mt">
          <button
            id="sendVibesButton"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={() =>
              setMotorState(
                motorState.map(() => ({
                  intensity: 0.1,
                  timer: 999,
                  vibing: false,
                }))
              )
            }
          >
            Send Vibes
          </button>
          <button
            id="stopVibesButton"
            className="ml"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={handleStopVibes}
          >
            Stop Vibes
          </button>
        </div>
        <div className="mt">
          <button
            id="linkVibesButton"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={() => setNotificationsLinked(true)}
          >
            Link Notifs
          </button>
          <button
            id="unlinkVibesButton"
            className="ml"
            disabled={!bpClient?.connected || !bpFoundDevice}
            onClick={() => setNotificationsLinked(false)}
          >
            Unlink Notifs
          </button>
        </div>
        <div className="mt">
            <button
              id="dummyNotifButton"
              disabled={!sharkeyConnected}
              onClick={handleDummyNotif}
            >Send Dummy Notif</button>
        </div>
        {motorState.map((motor, i) => (
          <div key={i} className="mt">
            {`Motor ${i+1}: ${motor.timer}`}
          </div>
        ))}
      </div>
      <div id="settingsBox" className="mx pr">
        <SettingsComponent 
          settings={settings}
          setSettings={setSettings}
          motorState={motorState}
          devices={devices}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
        />
      </div>
      <div id="notificationStream" className="notificationStream mx pl">
        <div id="notificationStreamHeader" className="mt">
          Notifications
        </div>
        <div id="notificationStreamBody" className="mt">
          {oldNotifications.map((notif) => notif && (
            <div key={notif.id} className="flex row justify-between">
              <div className="mx">{notif.user.username}</div>
              <div className="mx">{notif.type}</div>
              <div className="mx">{notif?.note?.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
