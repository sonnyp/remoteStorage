import { useState, useEffect } from "react";

import remoteStorage from "./remoteStorage";

export default function useRemoteStorage(path) {
  const [node, setNode] = useState();

  function get() {
    remoteStorage.get(path).then(async ([node, res]) => {
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
    });
  }

  useEffect(get, [path]);

  return [node, get];
}
