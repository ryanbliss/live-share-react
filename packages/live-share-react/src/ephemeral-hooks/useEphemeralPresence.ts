import {
  EphemeralPresence,
  EphemeralPresenceUser,
  PresenceState,
} from "@microsoft/live-share";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";
import { IUseEphemeralPresenceResults } from "../types";

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
   * User facing: Stateful `EphemeralPresence`, and non user-facing setter.
   */
  const [presence, setPresence] = useState<
    EphemeralPresence<TData> | undefined
  >();
  /**
   * Unique ID reference for the component.
   */
  const componentIdRef = useRef(uuid());
  /**
   * Stateful all user presence list and its non-user-facing setter method.
   */
  const [allUsers, setAllUsers] = useState<EphemeralPresenceUser<TData>[]>([]);
  /**
   * Import container and DDS object register callbacks from FluidContextProvider.
   */
  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();
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
      if (!presence) {
        console.error(
          new Error("Cannot call updatePresence when presence is undefined")
        );
        return;
      }
      if (!presence.isStarted) {
        console.error(
          new Error("Cannot call updatePresence while presence is not started")
        );
        return;
      }
      presence.updatePresence(state, data);
    },
    [presence]
  );

  /**
   * Once container is available, this effect will register the setter method so that the `EphemeralPresence` loaded
   * from `dynamicObjects` that matches `uniqueKey` can be passed back to this hook. If one does not yet exist,
   * a new `EphemeralPresence` is automatically created. If multiple users try to create a `EphemeralPresence` at the
   * same time when this component first mounts, `registerDDSSetStateAction` ensures that the hook will ultimately
   * self correct.
   *
   * @see registerDDSSetStateAction to see how DDS handles are attached/created for the `EphemeralPresence`.
   * @see unregisterDDSSetStateAction to see how this component stops listening to changes in the DDS handles on unmount.
   */
  useEffect(() => {
    if (!container) return;
    console.log("presence dds on");
    // Add type as a prefix for the key provided by the developer. This helps prevent typing conflicts.
    const _uniqueKey = `<EphemeralPresence>:${uniqueKey}`;
    // Callback method to set the `initialData` into the map when the `EphemeralPresence` is first created.
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
      // On unmount, unregister set state action and container connected listener
      console.log("presence dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  /**
   * Setup change listeners and start `EphemeralEvent` if needed
   */
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
    };
  }, [presence, userId, initialData, initialPresenceState]);

  return {
    localUser,
    otherUsers,
    allUsers,
    presence,
    updatePresence,
  };
}
