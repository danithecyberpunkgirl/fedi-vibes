import { useEffect, useState, useCallback } from "react";
import * as Sharkey from "misskey-js";

export const useSharkey = (apiToken) => {
  const [sharkeyStream, setSharkeyStream] = useState(null);
  const [sharkeyConnected, setSharkeyConnected] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
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
    (async function () {
      const sharkeyApi = new Sharkey.api.APIClient({
        origin: "https://transfem.social",
        credential: import.meta.env.VITE_TRANSFEM_SOCIAL_API_TOKEN,
      });
      let followerIdList = localStorage.getItem("followerIdList");
      followerIdList = followerIdList ? JSON.parse(followerIdList) : [];
      if (followerIdList.length === 0) {
        let pageEndId = "";
        let hasMoreFollowers = true;
        let breaker = 0;
        while (hasMoreFollowers && breaker < 2) {
          try {
            const followerPage = await sharkeyApi.request("users/followers", {
              ...(pageEndId.length > 0 ? { untilId: pageEndId } : {}),
              // untilId: "",
              limit: 100,
              userId: import.meta.env.VITE_TRANSFEM_SOCIAL_USER_ID,
            });
            if (followerPage.length > 0) {
              const newFollowers = followerPage.map((follower) => follower.id);
              pageEndId = followerPage[followerPage.length - 1].id;
              followerIdList.push(...newFollowers);
              hasMoreFollowers = followerPage.length === 100;
            } else {
              hasMoreFollowers = false;
            }
          } catch (e) {
            console.error(e);
          }
          breaker++;
        }
        localStorage.setItem("followerIdList", JSON.stringify(followerIdList));
      }
      setFollowerIds(followerIdList);
    })();
  }, []);

  useEffect(() => {}, []);

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
    followerIds,
    setNotifications,
    clearNotifications,
    oldNotifications,
    setOldNotifications,
  };
};
