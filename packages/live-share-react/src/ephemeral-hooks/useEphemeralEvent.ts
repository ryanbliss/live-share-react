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

export function useEphemeralEvent<TEvent extends object = object>(
  uniqueKey: string,
  allowedRoles?: UserMeetingRole[],
  onReceivedEvent?: OnReceivedEphemeralEventAction<TEvent>
): IUseEphemeralEventResults<TEvent> {
  const listeningRef = useRef(false);
  const [ephemeralEvent, setEphemeralEvent] = useState<EphemeralEvent>();
  const componentIdRef = useRef(uuid());
  const [latestEvent, setLatestReceived] =
    useState<IReceiveEphemeralEvent<TEvent>>();
  const allEvents = useRef<IReceiveEphemeralEvent<TEvent>[]>([]);

  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

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

  useEffect(() => {
    if (!container) return;
    console.log("EphemeralState dds on");
    const _uniqueKey = `<EphemeralEvent>:${uniqueKey}`;
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
      console.log("EphemeralEvent dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  useEffect(() => {
    if (listeningRef.current || !ephemeralEvent) return;
    listeningRef.current = true;

    const onEventReceived = (event: any, local: boolean) => {
      console.log("onEventReceived");
      onReceivedEvent?.(event as TEvent, local);
      const received: IReceiveEphemeralEvent<TEvent> = {
        event: event as TEvent,
        local,
      };
      allEvents.current = [...allEvents.current, received];
      setLatestReceived(received);
    };
    console.log("event received on");
    ephemeralEvent.on(EphemeralEventEvents.received, onEventReceived);
    if (!ephemeralEvent.isStarted) {
      console.log("starting EphemeralEvent");
      ephemeralEvent.start(allowedRoles);
    }

    return () => {
      listeningRef.current = false;
      console.log("event received off");
      ephemeralEvent?.off(EphemeralEventEvents.received, onEventReceived);
    };
  }, [ephemeralEvent, allowedRoles]);

  return {
    latestEvent,
    allEvents: allEvents.current,
    sendEvent,
    ephemeralEvent,
  };
}
