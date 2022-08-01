import {
  EphemeralEvent,
  EphemeralEventEvents,
  UserMeetingRole,
} from "@microsoft/live-share";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";
import {
  IUseEphemeralEventResults,
  OnReceivedEphemeralEventAction,
  SendEphemeralEventAction,
} from "../types";
import { IReceiveEphemeralEvent } from "../interfaces";

/**
 * React hook for using a Live Share `EphemeralEvent`.
 *
 * @remarks
 * Use this hook if you want to send transient JSON objects to everyone connected to the Fluid container,
 * such as when sending push notifications or reactions.
 *
 * @template TEvent Optional typing for events sent & received. Default is `object` type.
 * @param uniqueKey the unique key for the `EphemeralEvent`. If one does not yet exist, a new one
 * will be created, otherwise it will use the existing one.
 * @param allowedRoles Optional. The meeting roles eligible to send events through this object.
 * @param onReceivedEvent Optional. Callback method to be called when a new notification is received.
 * @returns stateful `latestEvent` & `allEvents` list, `sendEvent` callback, and the `ephemeralEvent` object.
 */
export function useEphemeralEvent<TEvent extends object = object>(
  uniqueKey: string,
  allowedRoles?: UserMeetingRole[],
  onReceivedEvent?: OnReceivedEphemeralEventAction<TEvent>
): IUseEphemeralEventResults<TEvent> {
  /**
   * Reference boolean for whether hook has registered "listening" events for `EphemeralEvent`.
   */
  const listeningRef = useRef(false);
  /**
   * User facing: Stateful `EphemeralEvent`, and non user-facing setter.
   */
  const [ephemeralEvent, setEphemeralEvent] = useState<EphemeralEvent>();
  /**
   * Unique ID reference for the component.
   */
  const componentIdRef = useRef(uuid());
  /**
   * Stateful latest event (user facing) and its non-user-facing setter method.
   */
  const [latestEvent, setLatestReceived] =
    useState<IReceiveEphemeralEvent<TEvent>>();
  /**
   * Reference for all received/sent events. The current value of this is user-facing. Because
   * this is always set at the same time as latestEvent, it is effectively a stateful value.
   */
  const allEventsRef = useRef<IReceiveEphemeralEvent<TEvent>[]>([]);
  /**
   * Import container and DDS object register callbacks from FluidContextProvider.
   */
  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

  /**
   * User facing: callback to send event through `EphemeralEvent`
   */
  const sendEvent: SendEphemeralEventAction<TEvent> = useCallback(
    (event: TEvent) => {
      if (!ephemeralEvent) {
        console.error(
          new Error("Cannot call emitEvent when ephemeralEvent is undefined")
        );
        return;
      }
      if (!ephemeralEvent.isStarted) {
        console.error(
          new Error("Cannot call emitEvent while ephemeralEvent is not started")
        );
        return;
      }
      console.log("sendEvent");
      ephemeralEvent?.sendEvent(event);
    },
    [ephemeralEvent]
  );

  /**
   * Once container is available, this effect will register the setter method so that the `EphemeralEvent` loaded
   * from `dynamicObjects` that matches `uniqueKey` can be passed back to this hook. If one does not yet exist,
   * a new `EphemeralEvent` is automatically created. If multiple users try to create a `EphemeralEvent` at the same
   * time when this component first mounts, `registerDDSSetStateAction` ensures that the hook will ultimately
   * self correct.
   *
   * @see registerDDSSetStateAction to see how DDS handles are attached/created for the `EphemeralEvent`.
   * @see unregisterDDSSetStateAction to see how this component stops listening to changes in the DDS handles on unmount.
   */
  useEffect(() => {
    if (!container) return;
    console.log("EphemeralState dds on");
    // Add type as a prefix for the key provided by the developer. This helps prevent typing conflicts.
    const _uniqueKey = `<EphemeralEvent>:${uniqueKey}`;
    // Callback method to set the `initialData` into the map when the `EphemeralEvent` is first created.
    const registerDDS = () => {
      registerDDSSetStateAction(
        _uniqueKey,
        componentIdRef.current,
        EphemeralEvent,
        setEphemeralEvent
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
      console.log("EphemeralEvent dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  /**
   * Setup change listeners and start `EphemeralEvent` if needed
   */
  useEffect(() => {
    if (listeningRef.current || !ephemeralEvent) return;
    listeningRef.current = true;
    // Register event listener
    const onEventReceived = (event: any, local: boolean) => {
      console.log("onEventReceived");
      // If developer passed the optional onReceivedEvent callback, we
      // call it.
      onReceivedEvent?.(event as TEvent, local);
      // Set the received event to our local state
      const received: IReceiveEphemeralEvent<TEvent> = {
        event: event as TEvent,
        local,
      };
      allEventsRef.current = [...allEventsRef.current, received];
      setLatestReceived(received);
    };
    console.log("event received on");
    ephemeralEvent.on(EphemeralEventEvents.received, onEventReceived);
    if (!ephemeralEvent.isStarted) {
      // Start ephemeral event
      ephemeralEvent.start(allowedRoles);
    }

    return () => {
      // on unmount, remove event listeners
      listeningRef.current = false;
      console.log("event received off");
      ephemeralEvent?.off(EphemeralEventEvents.received, onEventReceived);
    };
  }, [ephemeralEvent, allowedRoles]);

  return {
    latestEvent,
    allEvents: allEventsRef.current,
    sendEvent,
    ephemeralEvent,
  };
}
