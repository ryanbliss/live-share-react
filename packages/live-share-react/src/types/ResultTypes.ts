import { AzureContainerServices } from "@fluidframework/azure-client";
import { IFluidContainer, SharedMap } from "fluid-framework";

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
