import {
  EphemeralPresence,
  EphemeralPresenceUser,
  PresenceState,
} from "@microsoft/live-share";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IUseEphemeralPresenceResults } from "../types";
import { useDynamicDDS } from "../shared-hooks";

/**
 * React hook for using a Live Share `EphemeralPresence`.
 *
 * @remarks
 * Use this hook if you want to track presence for who is currently using this component, such as
 * who is online or who is viewing a specific document. With presence, you can sent along any custom
 * user data. This is useful for rendering a list of users, profile pictures, cursor positions, and more.
 *
 * @template TData Optional typing for the custom user presence data object. Default is `object` type.

 * @param userId Optional. The unique ID for a user. If none is provided, a random UUID will be generated.
 * @param initialData Optional. Initial presence data object for the user.
 * @param initialPresenceState Optional. Initial status of the user's presence. Default is online.
 * @param uniqueKey Optional. The unique key for `EphemeralPresence`. If one does not yet exist, a new one
 * will be created, otherwise it will use the existing one. Default value is ":<dds-default>"
 * @returns stateful `localUser`, `otherUsers` list, and `allUsers` list. Also returns a callback method
 * to update the local user's presence and the `EphemeralPresence` Fluid object.
 */
export function useEphemeralPresence<TData extends object = object>(
  userId?: string | undefined,
  initialData?: TData | undefined,
  initialPresenceState: PresenceState = PresenceState.online,
  uniqueKey: string = ":<dds-default>"
): IUseEphemeralPresenceResults<TData> {
  /**
   * Reference boolean for whether hook has registered "presenceChanged" events for `EphemeralPresence`.
   */
  const listeningRef = useRef(false);
  /**
   * Stateful all user presence list and its non-user-facing setter method.
   */
  const [allUsers, setAllUsers] = useState<EphemeralPresenceUser<TData>[]>([]);
  /**
   * User facing: dynamically load the EphemeralEvent DDS for the given unique key.
   */
  const { dds: ephemeralPresence } = useDynamicDDS<EphemeralPresence<TData>>(
    `<EphemeralPresence>:${uniqueKey}`,
    EphemeralPresence<TData>
  );
  /**
   * User facing: list of non-local user's presence objects.
   */
  const otherUsers = useMemo<EphemeralPresenceUser<TData>[]>(() => {
    return [...allUsers.filter((user) => !user.isLocalUser)];
  }, [allUsers]);

  /**
   * User facing: local user's presence object.
   */
  const localUser = useMemo<EphemeralPresenceUser<TData> | undefined>(() => {
    return allUsers.find((user) => user.isLocalUser);
  }, [allUsers]);

  /**
   * User facing: callback to update the local user's presence.
   */
  const updatePresence = useCallback(
    (state?: PresenceState | undefined, data?: TData | undefined) => {
      if (!ephemeralPresence) {
        console.error(
          new Error("Cannot call updatePresence when presence is undefined")
        );
        return;
      }
      if (!ephemeralPresence.isStarted) {
        console.error(
          new Error("Cannot call updatePresence while presence is not started")
        );
        return;
      }
      ephemeralPresence.updatePresence(state, data);
    },
    [ephemeralPresence]
  );

  /**
   * Setup change listeners and start `EphemeralEvent` if needed
   */
  useEffect(() => {
    if (listeningRef.current || !ephemeralPresence) return;
    listeningRef.current = true;

    const onPresenceChanged = () => {
      const updatedLocalUsers: EphemeralPresenceUser<TData>[] = [];
      ephemeralPresence?.forEach((user) => {
        updatedLocalUsers.push(user);
      });
      setAllUsers(updatedLocalUsers);
    };
    console.log("presenceChanged on");
    ephemeralPresence.on("presenceChanged", onPresenceChanged);

    if (!ephemeralPresence.isStarted) {
      console.log("starting presence");
      ephemeralPresence.start(userId, initialData, initialPresenceState);
    } else {
      console.log("presence already started, updating local cache");
      onPresenceChanged();
    }

    return () => {
      listeningRef.current = false;
      console.log("presenceChanged off");
      ephemeralPresence?.off("presenceChanged", onPresenceChanged);
    };
  }, [ephemeralPresence]);

  return {
    localUser,
    otherUsers,
    allUsers,
    ephemeralPresence,
    updatePresence,
  };
}
