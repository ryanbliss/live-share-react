import { AzureContainerServices } from "@fluidframework/azure-client";
import {
  EphemeralEvent,
  EphemeralPresence,
  EphemeralPresenceUser,
  IEphemeralEvent,
  PresenceState,
} from "@microsoft/live-share";
import { IFluidContainer, SharedMap } from "fluid-framework";
import { IReceiveEphemeralEvent } from "../interfaces";
import {
  OnUpdateEphemeralPresenceAction,
  SendEphemeralEventAction,
} from "./ActionTypes";

export interface IAzureContainerResults {
  /**
   * Fluid Container.
   */
  container: IFluidContainer;
  /**
   * Azure container services which has information such as current socket connections.
   */
  services: AzureContainerServices;
}

export interface ILiveShareContainerResults extends IAzureContainerResults {
  /**
   * Whether the local user/client initially created the container.
   */
  created: boolean;
}

export interface IUseSharedMapResults<TData> {
  /**
   * Stateful map of most recent values from `SharedMap`.
   */
  map: ReadonlyMap<string, TData>;
  /**
   * Callback method to set/replace new entries in the `SharedMap`.
   */
  setEntry: (key: string, value: TData) => void;
  /**
   * Callback method to delete an existing entry in the `SharedMap`.
   */
  deleteEntry: (key: string) => void;
  /**
   * The Fluid `SharedMap` object, should you want to use it directly.
   */
  sharedMap: SharedMap | undefined;
}

export interface IUseEphemeralEventResults<TEvent extends object = object> {
  /**
   * The most recent event that has been received in the session.
   */
  latestEvent: IReceiveEphemeralEvent<TEvent> | undefined;
  /**
   * All received events since initializing this component, sorted from oldest -> newest.
   */
  allEvents: IReceiveEphemeralEvent<TEvent>[];
  /**
   * Callback method to send a new event to users in the session.
   */
  sendEvent: SendEphemeralEventAction<TEvent>;
  /**
   * The `EphemeralEvent` object, should you want to use it directly.
   */
  ephemeralEvent: EphemeralEvent | undefined;
}

export interface IUseEphemeralPresenceResults<TData extends object = object> {
  /**
   * The local user's presence object.
   */
  localUser: EphemeralPresenceUser<TData> | undefined;
  /**
   * List of non-local user's presence objects.
   */
  otherUsers: EphemeralPresenceUser<TData>[];
  /**
   * List of all user's presence objects.
   */
  allUsers: EphemeralPresenceUser<TData>[];
  /**
   * Live Share `EphemeralPresence` object, should you want to use it directly.
   */
  presence: EphemeralPresence<TData> | undefined;
  /**
   * Callback method to update the local user's presence.
   */
  updatePresence: OnUpdateEphemeralPresenceAction<TData>;
}
