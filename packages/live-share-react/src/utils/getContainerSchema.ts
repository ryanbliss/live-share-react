import {
  EphemeralEvent,
  EphemeralPresence,
  EphemeralState,
  EphemeralTimer,
} from "@microsoft/live-share";
import { EphemeralMediaSession } from "@microsoft/live-share-media";
import { ContainerSchema, LoadableObjectClass, SharedDirectory, SharedMap, SharedString } from "fluid-framework";

const schema: ContainerSchema = {
  initialObjects: {
    stateMap: SharedMap,
    dynamicObjects: SharedMap,
  },
  dynamicObjectTypes: [SharedMap, SharedString, SharedDirectory],
};

export function getContainerSchema(
  additionalDynamicObjectTypes: LoadableObjectClass<any>[] | undefined
): ContainerSchema {
  const _additionalDynamicObjectTypes: LoadableObjectClass<any>[] =
    additionalDynamicObjectTypes ?? [];
  return {
    initialObjects: schema.initialObjects,
    dynamicObjectTypes: [
      ...schema.dynamicObjectTypes!,
      ..._additionalDynamicObjectTypes,
    ],
  };
}

export function getLiveShareContainerSchema(
  additionalDynamicObjectTypes: LoadableObjectClass<any>[] | undefined
) {
  const liveShareDynamicObjects = [
    EphemeralEvent,
    EphemeralPresence,
    EphemeralState,
    EphemeralTimer,
    EphemeralMediaSession,
  ];
  const _additionalDynamicObjectTypes: LoadableObjectClass<any>[] =
    additionalDynamicObjectTypes ?? [];
  return getContainerSchema([
    ...liveShareDynamicObjects,
    ..._additionalDynamicObjectTypes,
  ]);
}
