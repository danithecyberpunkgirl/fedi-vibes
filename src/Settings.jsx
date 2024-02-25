export const SettingsComponent = ({
  settings,
  setSettings,
  motorState,
  devices,
  selectedDevice,
  setSelectedDevice,
}) => {
  const handleChangeDevice = (e) => {
    selectedDevice.stop();
    const device = devices.find((d) => d.name === e.target.value);
    setSelectedDevice(device);
  };
  const handleSwitchMotor = (notifType, motorIndex) => {
    setSettings((prev) => {
      return {
        ...prev,
        [notifType]: {
          ...prev[notifType],
          vibeIndex: motorIndex,
        },
      };
    });
  };
  const handleSetIntensity = (notifType, intensity) => {
    setSettings((prev) => {
      return {
        ...prev,
        [notifType]: {
          ...prev[notifType],
          vibeIntensity: intensity,
        },
      };
    });
  };
  const handleSetTimeIncrease = (notifType, timeIncrease) => {
    setSettings((prev) => {
      return {
        ...prev,
        [notifType]: {
          ...prev[notifType],
          secondsPerNotification: timeIncrease,
        },
      };
    });
  };
  return (
    <div className="flex column justify-start w-100">
      {devices && devices?.length > 0 && (
        <>
          <label htmlFor="deviceSelect">Device</label>
          <select
            id="deviceSelect"
            className="mb w-large"
            value={selectedDevice?.name}
            onChange={handleChangeDevice}
          >
            {devices.map((device) => (
              <option key={device.name} value={device.name}>
                {device.name}
              </option>
            ))}
          </select>
        </>
      )}
      {settings &&
        Object.entries(settings).map(([notifType, sets]) => {
          return (
            <div className="flex row justify-between mb" key={notifType}>
              <div className="flex column w-small">
                <label htmlFor={`${notifType}NotifLabel`}>Type</label>
                <input
                  id={`${notifType}NotifLabel`}
                  type="text"
                  value={notifType}
                  readOnly
                />
              </div>
              <div className="flex column w-medium">
                <label htmlFor={`${notifType}Motors`}>Motor Index</label>
                <select
                  id={`${notifType}Motors`}
                  value={sets.vibeIndex}
                  onChange={(e) => handleSwitchMotor(notifType, e.target.value)}
                >
                  <option value="all">all</option>
                  {motorState.map((motor, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex column w-medium">
                <label htmlFor={`${notifType}Intensity`}>Intensity {sets.vibeIntensity}</label>
                <input
                  id={`${notifType}Intensity`}
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={sets.vibeIntensity}
                  onChange={(e) =>
                    handleSetIntensity(notifType, parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="flex column w-medium">
                <label htmlFor={`${notifType}TimeIncrease`}>
                  Time Increase
                </label>
                <input
                  id={`${notifType}TimeIncrease`}
                  type="number"
                  value={sets.secondsPerNotification}
                  onChange={(e) =>
                    handleSetTimeIncrease(notifType, parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};
