import { EphemeralState, UserMeetingRole } from "@microsoft/live-share";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";
import { SetEphemeralStateAction } from "../types";

interface IEphemeralStateStatus<TState extends string = string, TData extends object = object> {
  state?: TState;
  data?: TData;
}

export function useEphemeralState<TState extends string = string, TData extends object = object>(
  uniqueKey: string,
  allowedRoles?: UserMeetingRole[],
  initialState?: TState,
  initialData?: TData,
): [
  TState | undefined,
  TData | undefined,
  SetEphemeralStateAction<TState, TData>,
] {
  const listeningRef = useRef(false);
  const [ephemeralState, setEphemeralState] = useState<
    EphemeralState<TData> | undefined
  >();
  const componentIdRef = useRef(uuid());
  const [current, setCurrent] = useState<IEphemeralStateStatus<TState, TData>>({
    state: initialState,
    data: initialData,
  });

  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

  const changeState = useCallback((state: TState, value?: TData | undefined) => {
    if (!ephemeralState) {
      console.error(new Error("Cannot call changeState when ephemeralState is undefined"));
      return;
    }
    if (!ephemeralState.isStarted) {
      console.error(new Error("Cannot call changeState while ephemeralState is not started"));
      return;
    }
    console.log("changeState");
    ephemeralState?.changeState(state, value);
  }, [ephemeralState]);
  
  useEffect(() => {
    if (!container) return;
    console.log("EphemeralState dds on");
    const _uniqueKey = `<EphemeralState>:${uniqueKey}`;
    const registerDDS = () => {
      registerDDSSetStateAction(
        _uniqueKey,
        componentIdRef.current,
        EphemeralState<TData>,
        setEphemeralState
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
      console.log("EphemeralState dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  useEffect(() => {
    if (listeningRef.current || !ephemeralState) return;
    listeningRef.current = true;

    const onStateChanged = (state: TState, data: TData|undefined) => {
      console.log("onStateChanged");
      setCurrent({
        state,
        data,
      });
    };
    console.log("stateChanged on");
    ephemeralState.on("stateChanged", onStateChanged);
    if (!ephemeralState.isStarted) {
      console.log("starting EphemeralState");
      ephemeralState.start(allowedRoles, initialState, initialData);
      if (ephemeralState.state) {
        onStateChanged(ephemeralState.state as TState, ephemeralState.data);
      }
    } else if (ephemeralState.state) {
      console.log("ephemeralState already started, refreshing tracked state");
      onStateChanged(ephemeralState.state as TState, ephemeralState.data);
    }
    
    return () => {
      listeningRef.current = false;
      console.log("stateChanged off");
      ephemeralState?.off("stateChanged", onStateChanged);
    }
  }, [ephemeralState, initialState, initialData, allowedRoles]);

  return [
    current?.state,
    current?.data,
    changeState,
  ];
};
