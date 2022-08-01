import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
  FluidContextProvider,
  LiveShareContextProvider,
} from "@microsoft/live-share-react";
import {
  AzureClient,
  AzureConnectionConfig,
} from "@fluidframework/azure-client";
import { inTeams } from "./utils/inTeams";
import { TeamsFluidClient } from "@microsoft/live-share";
import { useRef } from "react";
import {
  ExampleEphemeralPresence,
  ExampleSharedMap,
  ExampleEphemeralState,
  ExampleSharedState,
  ExampleMediaSynchronizer,
  ExampleEphemeralEvent,
} from "./components";

const localConnection: AzureConnectionConfig = {
  tenantId: "local",
  tokenProvider: new InsecureTokenProvider("", {
    id: "123",
  }),
  orderer: "http://localhost:7070",
  storage: "http://localhost:7070",
};
const azureClientOptions = {
  connection: localConnection,
};
const teamsClientOptions = {
  connection: !inTeams() ? localConnection : undefined,
};

export default function App() {
  // set to false to use AzureClient Fluid container
  const shouldUseLiveShare = useRef(true);
  if (shouldUseLiveShare.current) {
    return (
      <LiveShareContextProvider
        clientOptions={teamsClientOptions}
        joinOnLoad={true}
        initializeTeamsSDKIfNeeded={true}
      >
        <ExampleEphemeralState
          waitingContent={
            <>
              <ExampleMediaSynchronizer />
              <ExampleEphemeralEvent />
            </>
          }
          startContent={
            <>
              <ExampleSharedState />
              <ExampleEphemeralPresence />
              <ExampleSharedMap />
            </>
          }
        />
      </LiveShareContextProvider>
    );
  }
  return (
    <FluidContextProvider
      clientOptions={azureClientOptions}
      createOnLoad={true}
      joinOnLoad={true}
      containerId={window.location.hash.substring(1)}
    >
      <ExampleSharedState />
      <ExampleSharedMap />
    </FluidContextProvider>
  );
}
