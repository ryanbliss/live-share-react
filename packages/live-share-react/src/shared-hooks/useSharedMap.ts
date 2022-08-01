import { useCallback, useEffect, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";
import { SharedMap } from "fluid-framework";
import { isEntries, isJSON, isMap } from "../utils";
import { IUseSharedMapResults, SharedMapInitialData } from "../types";

/**
 * Helper method for converting different initial data props into a Map<string, TData> to insert into the Fluid SharedMap
 * @template TData Optional typing for objects stored in the SharedMap. Default is `object` type.
 * @param initialData a JS Map, entries array, or JSON object.
 * @returns A Map<string, TData> with the entries provided.
 */
function getInitialData<TData>(
  initialData: SharedMapInitialData<TData>
): Map<string, TData> {
  if (isMap(initialData)) {
    return initialData;
  } else if (isEntries(initialData)) {
    return new Map<string, TData>(initialData);
  } else if (isJSON(initialData)) {
    const values: (readonly [string, TData])[] = Object.keys(initialData).map(
      (key) => {
        return [key, initialData[key]];
      }
    );
    return new Map<string, TData>(values);
  }
  return new Map<string, TData>();
}

/**
 * React hook for using a Fluid `SharedMap`.
 *
 * @remarks
 * The primary benefit of using the `useSharedMap` hook rather than the Fluid `SharedMap`
 * directly is that it integrates nicely with React state and automates repetitive tasks.
 * If you want to use `SharedMap` this hook creates directly, you can do that as well.
 *
 * @template TData Optional typing for objects stored in the SharedMap. Default is `object` type.
 * @param uniqueKey the unique key for the `SharedMap`. If one does not yet exist, a new `SharedMap`
 * will be created, otherwise it will use the existing one.
 * @param initialData a JS Map, entries array, or JSON object to insert into the `SharedMap` when creating
 * the DDS for the first time.
 * @returns stateful `map` entries, `setEntry` callback, `deleteEntry` callback, and the Fluid `sharedMap`.
 */
export function useSharedMap<TData extends object = object>(
  uniqueKey: string,
  initialData?: SharedMapInitialData<TData>
): IUseSharedMapResults<TData> {
  /**
   * Reference boolean for whether hook has registered "valueChanged" events for `SharedMap`.
   */
  const listeningRef = useRef(false);
  /**
   * User facing: Stateful `SharedMap`, and non user-facing setter.
   */
  const [sharedMap, setSharedMap] = useState<SharedMap | undefined>();
  /**
   * Unique ID reference for the component.
   */
  const componentIdRef = useRef(uuid());
  /**
   * Stateful readonly map (user facing) with most recent values from `SharedMap` and its setter method.
   */
  const [map, setMap] = useState<ReadonlyMap<string, TData>>(
    getInitialData<TData>(initialData)
  );
  /**
   * Import container and DDS object register callbacks from FluidContextProvider.
   */
  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

  /**
   * User facing: set a value to the Fluid `SharedMap`.
   */
  const setEntry = useCallback(
    (key: string, value: TData) => {
      if (!sharedMap) {
        console.error(new Error("Cannot call set when sharedMap is undefined"));
        return;
      }
      sharedMap.set(key, value);
    },
    [sharedMap]
  );

  /**
   * User facing: delete a value from the Fluid `SharedMap`.
   */
  const deleteEntry = useCallback(
    (key: string) => {
      if (!sharedMap) {
        console.error(
          new Error("Cannot call remove when sharedMap is undefined")
        );
        return;
      }
      sharedMap.delete(key);
    },
    [sharedMap]
  );

  /**
   * Once container is available, this effect will register the setter method so that the `SharedMap` loaded
   * from `dynamicObjects` that matches `uniqueKey` can be passed back to this hook. If one does not yet exist,
   * a new `SharedMap` is automatically created. If multiple users try to create a `SharedMap` at the same time when
   * this component first mounts, `registerDDSSetStateAction` ensures that the hook will ultimately self correct.
   *
   * @see registerDDSSetStateAction to see how DDS handles are attached/created for the `SharedMap`.
   * @see unregisterDDSSetStateAction to see how this component stops listening to changes in the DDS handles on unmount.
   */
  useEffect(() => {
    if (!container) return;
    // Add type as a prefix for the key provided by the developer. This helps prevent typing conflicts.
    const _uniqueKey = `<SharedMap>:${uniqueKey}`;
    // Callback method to set the `initialData` into the map when the `SharedMap` is first created.
    const onFirstInitialize = (dds: SharedMap) => {
      getInitialData(initialData).forEach((value, key) => {
        dds.set(key, value);
      });
    };

    // Callback method to register the setter for the `SharedMap`.
    const registerDDS = () => {
      registerDDSSetStateAction(
        _uniqueKey,
        componentIdRef.current,
        SharedMap,
        setSharedMap,
        onFirstInitialize
      );
      container.off("connected", registerDDS);
    };

    if (container.connectionState === 2) {
      // Container is already connected, register the DDS set state action
      registerDDS();
    } else {
      // Wait until connected event to ensure we have the latest document and don't accidentally
      // override a dds handle recently created by another client
      container.on("connected", registerDDS);
    }

    return () => {
      // On unmount, we stop listening for changes to `SharedMap`
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      // Also remove the connected listener, in case this component unmounts before container connects.
      container.off("connected", registerDDS);
    };
  }, [container, initialData]);

  // Setup change listeners, initial values, etc.
  useEffect(() => {
    if (listeningRef.current || !sharedMap) return;
    listeningRef.current = true;

    // Register valueChanged listener for `SharedMap`.
    const onValueChanged = () => {
      setMap(new Map<string, TData>(sharedMap.entries()));
    };
    console.log("valueChanged on");
    sharedMap.on("valueChanged", onValueChanged);
    // Get initial values from `SharedMap`.
    onValueChanged();

    return () => {
      // Cleanup on component unmount.
      listeningRef.current = false;
      console.log("valueChanged off");
      sharedMap?.off("valueChanged", onValueChanged);
    };
  }, [sharedMap]);

  return {
    map,
    setEntry,
    deleteEntry,
    sharedMap,
  };
}
