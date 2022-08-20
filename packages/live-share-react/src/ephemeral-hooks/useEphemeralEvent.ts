import {
  EphemeralEvent,
  EphemeralEventEvents,
  UserMeetingRole,
} from "@microsoft/live-share";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IUseEphemeralEventResults,
  OnReceivedEphemeralEventAction,
  SendEphemeralEventAction,
} from "../types";
import { IReceiveEphemeralEvent } from "../interfaces";
import { useDynamicDDS } from "../shared-hooks";

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
   * User facing: dynamically load the EphemeralEvent DDS for the given unique key.
   */
  const { dds: ephemeralEvent } = useDynamicDDS<EphemeralEvent>(
    `<EphemeralEvent>:${uniqueKey}`,
    EphemeralEvent
  );

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
    if (!ephemeralEvent.isInitialized) {
      // Start ephemeral event
      ephemeralEvent.initialize(allowedRoles);
    }

    return () => {
      // on unmount, remove event listeners
      listeningRef.current = false;
      console.log("event received off");
      ephemeralEvent?.off(EphemeralEventEvents.received, onEventReceived);
    };
  }, [ephemeralEvent]);

  return {
    latestEvent,
    allEvents: allEventsRef.current,
    sendEvent,
    ephemeralEvent,
  };
}
