import { IFluidContainer, LoadableObjectClass } from "fluid-framework";
import React from "react";
import { ILiveShareContainerResults } from "../types";
import {
  useDDSSetStateActionRegistry,
  useSharedSetStateActionRegistry,
} from "../internal-hooks";
import {
  ITeamsFluidClientOptions,
  TeamsFluidClient,
} from "@microsoft/live-share";
import { FluidContext } from "./FluidContextProvider";
import { getLiveShareContainerSchema } from "../utils";
import { app } from "@microsoft/teams-js";

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
  clientOptions?: ITeamsFluidClientOptions;
  joinOnLoad?: boolean;
  initializeTeamsSDKIfNeeded?: boolean;
  additionalDynamicObjectTypes?: LoadableObjectClass<any>[];
  children?: React.ReactNode;
}

export const LiveShareContextProvider: React.FC<
  ILiveShareContextProviderProps
> = (props) => {
  const startedRef = React.useRef(false);
  const clientRef = React.useRef(new TeamsFluidClient(props.clientOptions));
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
        if (!clientRef.current.isTesting && !app.isInitialized()) {
          if (props.initializeTeamsSDKIfNeeded === true) {
            await app.initialize().catch((error) => reject(error));
            app.notifySuccess();
          } else {
            reject(
              new Error(
                'Teams JS SDK is not initialized. To fix:\n\n  import { app } from "@microsoft/teams-js";\n  await app.initialize();\n\nOR\n\nSet the "initializeTeamsSDKIfNeeded" prop to true for the LiveShareContextProvider.'
              )
            );
          }
        }
        try {
          const results: ILiveShareContainerResults =
            await clientRef.current.joinContainer(
              getLiveShareContainerSchema(props.additionalDynamicObjectTypes),
              onInitializeContainer
            );
          setResults(results);
          resolve(results);
        } catch (error: any) {
          reject(error);
        }
      });
    },
    [
      props.additionalDynamicObjectTypes,
      props.initializeTeamsSDKIfNeeded,
      setResults,
    ]
  );

  React.useEffect(() => {
    if (results || startedRef.current) return;
    startedRef.current = true;
    if (props.joinOnLoad) {
      joinContainer().catch((error) => {
        console.error(error);
        if (error instanceof Error) {
          setJoinError(error);
        } else {
          setJoinError(
            new Error(
              "LiveShareContextProvider: An unknown error occurred while joining container."
            )
          );
        }
      });
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
