import { useState, useEffect } from "react";

import remoteStorage from "./remoteStorage";

import useGlobalState from "./useGlobalState";

export default function useRemoteStorage(path) {
  const [node, setNode] = useState();
  const [status, setStatus] = useGlobalState("status");

  function get() {
    return remoteStorage
      .get(path)
      .then(([node, res]) => {
        if (node.items) {
          node.items = Object.entries(node.items).map(([name, item]) => {
            return {
              path: path + name,
              name,
              ...item,
            };
          });
        }
        setNode(node);
      })
      .catch((err) => {
        console.error(err);
        setStatus("disconnected");
      });
  }

  useEffect(() => {
    get();

    return () => {
      setNode();
    };
  }, [path]);

  return [node, get];
}
