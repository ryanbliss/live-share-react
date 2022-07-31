import { Dispatch, SetStateAction } from "react";
import { IFluidLoadable } from "@fluidframework/core-interfaces";
import { LoadableObjectClass } from "fluid-framework";

// React actions
export type SetSharedStateAction<T> = (state: T) => void;
export type SetLocalStateAction = Dispatch<SetStateAction<any>>;

// Fluid actions
export type RegisterDDSSetStateAction = <T extends IFluidLoadable>(
  uniqueKey: string,
  componentId: string,
  objectClass: LoadableObjectClass<T>,
  setLocalStateAction: SetLocalStateAction,
  onDidFirstInitialize?: (dds: T) => void
) => void;

export type UnregisterDDSSetStateAction = (
  uniqueKey: string,
  componentId: string
) => void;

export type RegisterSharedSetStateAction = (
  uniqueKey: string,
  componentId: string,
  setLocalStateAction: SetLocalStateAction
) => void;

export type UnregisterSharedSetStateAction = (
  uniqueKey: string,
  componentId: string
) => void;

export type UpdateSharedStateAction = (uniqueKey: string, value: any) => void;

export type DeleteSharedStateAction = (uniqueKey: string) => void;
export type DisposeSharedStateAction = () => void;

// Live Share actions

export type SetEphemeralStateAction<TState, TData> = (
  state: TState,
  value?: TData | undefined
) => void;
