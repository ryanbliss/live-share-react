import { EphemeralPresence, EphemeralPresenceUser, PresenceState } from "@microsoft/live-share";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";

export function useEphemeralPresence<TData extends object = object>(
  userId?: string | undefined,
  initialData?: TData | undefined,
  initialPresenceState?: PresenceState | undefined,
  uniqueKey?: string
): {
  localUser: EphemeralPresenceUser<TData> | undefined;
  otherUsers: EphemeralPresenceUser<TData>[];
  allUsers: EphemeralPresenceUser<TData>[];
  presence: EphemeralPresence<TData> | undefined;
  updatePresence: (state?: PresenceState | undefined, data?: TData | undefined) => void;
} {
  const listeningRef = useRef(false);
  const [presence, setPresence] = useState<
    EphemeralPresence<TData> | undefined
  >();
  const componentIdRef = useRef(uuid());
  const [allUsers, setAllUsers] = useState<EphemeralPresenceUser<TData>[]>([]);

  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

  const otherUsers = useMemo<EphemeralPresenceUser<TData>[]>(() => {
    return [
      ...allUsers.filter((user) => !user.isLocalUser),
    ];
  }, [allUsers]);

  const localUser = useMemo<EphemeralPresenceUser<TData> | undefined>(() => {
    return allUsers.find((user) => user.isLocalUser);
  }, [allUsers]);

  const updatePresence = useCallback((state?: PresenceState | undefined, data?: TData | undefined) => {
    if (!presence) {
      console.error(new Error("Cannot call updatePresence when presence is undefined"));
      return;
    }
    if (!presence.isStarted) {
      console.error(new Error("Cannot call updatePresence while presence is not started"));
      return;
    }
    presence.updatePresence(state, data);
  }, [presence]);
  
  useEffect(() => {
    if (!container) return;
    console.log("presence dds on");
    const _uniqueKey = uniqueKey ?? "<EphemeralPresence>:<dds-default>";
    const registerDDS = () => {
      registerDDSSetStateAction(
        _uniqueKey,
        componentIdRef.current,
        EphemeralPresence<TData>,
        setPresence
      );
      container.off("connected", registerDDS);
    };
    // Wait until connected event to ensure we have the latest document
    // and don't accidentally override a dds handle recently created
    // by another client
    if (container.connectionState === 2) {
      registerDDS();
    } else {
      container.on("connected", registerDDS);
    }
    return () => {
      console.log("presence dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  useEffect(() => {
    if (listeningRef.current || !presence) return;
    listeningRef.current = true;

    const onPresenceChanged = () => {
      const updatedLocalUsers: EphemeralPresenceUser<TData>[] = [];
      presence?.forEach((user) => {
        updatedLocalUsers.push(user);
      });
      setAllUsers(updatedLocalUsers);
    };
    console.log("presenceChanged on");
    presence.on("presenceChanged", onPresenceChanged);

    if (!presence.isStarted) {
      console.log("starting presence");
      presence.start(userId, initialData, initialPresenceState);
    } else {
      console.log("presence already started, updating local cache");
      onPresenceChanged();
    }
    
    return () => {
      listeningRef.current = false;
      console.log("presenceChanged off");
      presence?.off("presenceChanged", onPresenceChanged);
    }
  }, [presence, userId, initialData, initialPresenceState]);

  return {
    localUser,
    otherUsers,
    allUsers,
    presence,
    updatePresence,
  }
};
