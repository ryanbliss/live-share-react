import { EphemeralState, UserMeetingRole } from "@microsoft/live-share";
import { useCallback, useEffect, useRef, useState } from "react";
import { SetEphemeralStateAction } from "../types";
import { useDynamicDDS } from "../shared-hooks";

interface IEphemeralStateStatus<
  TState extends string = string,
  TData extends object = object
> {
  state?: TState;
  data?: TData;
}

export function useEphemeralState<
  TState extends string = string,
  TData extends object = object
>(
  uniqueKey: string,
  allowedRoles?: UserMeetingRole[],
  initialState?: TState,
  initialData?: TData
): [
  TState | undefined,
  TData | undefined,
  SetEphemeralStateAction<TState, TData>
] {
  const listeningRef = useRef(false);
  const [current, setCurrent] = useState<IEphemeralStateStatus<TState, TData>>({
    state: initialState,
    data: initialData,
  });

  const { dds: ephemeralState } = useDynamicDDS<EphemeralState<TData>>(
    `<EphemeralState>:${uniqueKey}`,
    EphemeralState<TData>
  );

  const changeState = useCallback(
    (state: TState, value?: TData | undefined) => {
      if (!ephemeralState) {
        console.error(
          new Error("Cannot call changeState when ephemeralState is undefined")
        );
        return;
      }
      if (!ephemeralState.isInitialized) {
        console.error(
          new Error(
            "Cannot call changeState while ephemeralState is not started"
          )
        );
        return;
      }
      console.log("changeState");
      ephemeralState?.changeState(state, value);
    },
    [ephemeralState]
  );

  useEffect(() => {
    if (listeningRef.current || !ephemeralState) return;
    listeningRef.current = true;

    const onStateChanged = (state: TState, data: TData | undefined) => {
      console.log("onStateChanged");
      setCurrent({
        state,
        data,
      });
    };
    console.log("stateChanged on");
    ephemeralState.on("stateChanged", onStateChanged);
    if (!ephemeralState.isInitialized) {
      console.log("starting EphemeralState");
      ephemeralState.initialize(allowedRoles, initialState, initialData);
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
    };
  }, [ephemeralState]);

  return [current?.state, current?.data, changeState];
}
