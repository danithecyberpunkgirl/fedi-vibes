import {useState, useEffect} from "react";
export const useLoopingTimer = () => {
  //create a timer that repeatedly loops from 0 to 60 incrementing by 1 every second
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      setTimer((timer + 1) % 60);
    }, 1000);
    return () => clearTimeout(timeoutRef);
  }, [timer]);
  return [timer];
};
