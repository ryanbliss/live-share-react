import { IFluidContainer, LoadableObjectClass } from "fluid-framework";
import React from "react";
import { ILiveShareContainerResults } from "../types";
import {
  useDDSSetStateActionRegistry,
  useSharedSetStateActionRegistry,
} from "../internal-hooks";
import { TeamsFluidClient } from "@microsoft/live-share";
import { FluidContext } from "./FluidContextProvider";
import { getLiveShareContainerSchema } from "../utils";

interface ILiveShareContext {
  created: boolean | undefined;
  joinContainer: (
    onInitializeContainer?: (container: IFluidContainer) => void
  ) => Promise<ILiveShareContainerResults>;
}

export const LiveShareContext = React.createContext<ILiveShareContext>(
  {} as ILiveShareContext
);

export const useLiveShareContext = (): ILiveShareContext => {
  const context = React.useContext(LiveShareContext);
  return context;
};

interface ILiveShareContextProviderProps {
  client: TeamsFluidClient;
  joinOnLoad?: boolean;
  additionalDynamicObjectTypes?: LoadableObjectClass<any>[];
  children?: React.ReactNode;
}

export const LiveShareContextProvider: React.FC<ILiveShareContextProviderProps> = (
  props
) => {
  const startedRef = React.useRef(false);
  const [results, setResults] = React.useState<
    ILiveShareContainerResults | undefined
  >();
  const [joinError, setJoinError] = React.useState<Error | undefined>();

  const stateRegistryCallbacks = useSharedSetStateActionRegistry(results);
  const ddsRegistryCallbacks = useDDSSetStateActionRegistry(results);

  const joinContainer = React.useCallback(
    async (
      onInitializeContainer?: (container: IFluidContainer) => void
    ): Promise<ILiveShareContainerResults> => {
      return new Promise(async (resolve, reject) => {
        try {
          const results: ILiveShareContainerResults =
            await props.client.joinContainer(
              getLiveShareContainerSchema(props.additionalDynamicObjectTypes),
              onInitializeContainer
            );
          setResults(results);
          resolve(results);
        } catch (error: any) {
          if (error instanceof Error) {
            setJoinError(error);
          }
          reject(error);
        }
      });
    },
    [props.client, props.additionalDynamicObjectTypes, setResults]
  );

  React.useEffect(() => {
    if (results || startedRef.current) return;
    startedRef.current = true;
    if (props.joinOnLoad) {
      joinContainer();
    }
  }, [results, props.joinOnLoad, joinContainer]);

  return (
    <LiveShareContext.Provider
      value={{
        created: results?.created,
        joinContainer,
      }}
    >
      <FluidContext.Provider
        value={{
          container: results?.container,
          services: results?.services,
          joinError,
          getContainer: async () => {
            throw new Error(
              "Cannot join new container through getContainer in LiveShareContextProvider"
            );
          },
          createContainer: async () => {
            throw new Error(
              "Cannot create new container through createContainer in LiveShareContextProvider"
            );
          },
          ...stateRegistryCallbacks,
          ...ddsRegistryCallbacks,
        }}
      >
        {props.children}
      </FluidContext.Provider>
    </LiveShareContext.Provider>
  );
};
