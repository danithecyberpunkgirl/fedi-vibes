import { useEffect, useState, useCallback } from "react";
import * as Sharkey from "misskey-js";

export const useSharkey = (apiToken) => {
  const [sharkeyStream, setSharkeyStream] = useState(null);
  const [sharkeyConnected, setSharkeyConnected] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    const stream = new Sharkey.Stream("https://transfem.social", {
      token: apiToken,
    });
    const mainChannel = stream.useChannel("main");
    mainChannel.on("notification", (notification) => {
      setNotifications((prev) => {
        if (prev.findIndex((n) => n.id === notification.id) > -1) {
          return prev;
        }
        return [...prev, notification];
      });
    });
    //temp testing with other's posts instead of notifications
    // const homeChannel = stream.useChannel("localTimeline");
    // homeChannel.on("note", (note) => {
    //   setNotifications((prev) => {
    //     if (prev.findIndex((n) => n.id === note.id) > -1) {
    //       return prev;
    //     }
    //     return [...prev, note]
    //   });
    // });
    setSharkeyStream(stream);

    // REST API constructor in case we need it
    // const sharkeyApi = new Sharkey.api.APIClient({
    //   origin: "https://transfem.social",
    //   credential: import.meta.env.VITE_TRANSFEM_SOCIAL_API_TOKEN,
    // });
    // sharkeyApi
    //   .request("i/notifications", { limit: 20 })
    //   .then((newNotifications) => {
    //     console.dir(newNotifications);
    //   });
  }, []);

  useEffect(() => {
    if (sharkeyStream?.state === "connected") {
      setSharkeyConnected(true);
    } else {
      setSharkeyConnected(false);
    }
  }, [sharkeyStream?.state]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  return {
    sharkeyStream,
    sharkeyConnected,
    notifications,
    setNotifications,
    clearNotifications,
    oldNotifications,
    setOldNotifications,
  };
};
