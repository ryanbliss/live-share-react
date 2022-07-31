import { UserMeetingRole } from "@microsoft/live-share";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useFluidObjectsContext } from "../providers";
import { v4 as uuid } from "uuid";
import {
  EphemeralMediaSession,
  ExtendedMediaMetadata,
  IMediaPlayer,
  MediaPlayerSynchronizer,
  MediaSessionCoordinatorSuspension,
} from "@microsoft/live-share-media";
import { isExtendedMediaMetadata, isMediaElement, isRefObject } from "../utils";

export function useMediaSynchronizer(
  uniqueKey: string,
  mediaPlayerElementRef: RefObject<IMediaPlayer> | string,
  initialTrack: Partial<ExtendedMediaMetadata> | string | null,
  allowedRoles?: UserMeetingRole[],
  viewOnly?: boolean
): {
  mediaSynchronizer: MediaPlayerSynchronizer | undefined;
  suspended: boolean;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
  setTrack: (track: Partial<ExtendedMediaMetadata> | null) => void;
  endSuspension: () => void;
} {
  const listeningRef = useRef(false);
  const componentIdRef = useRef(uuid());
  const [mediaSession, setMediaSession] = useState<
    EphemeralMediaSession | undefined
  >();
  const [mediaSynchronizer, setMediaSynchronizer] = useState<
    MediaPlayerSynchronizer | undefined
  >();
  const [suspension, setSuspension] = useState<
    MediaSessionCoordinatorSuspension | undefined
  >();

  const { container, registerDDSSetStateAction, unregisterDDSSetStateAction } =
    useFluidObjectsContext();

  const play = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        mediaSynchronizer!.play();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }, [mediaSynchronizer]);

  const pause = useCallback((): void => {
    mediaSynchronizer?.pause();
  }, [mediaSynchronizer]);

  const seekTo = useCallback(
    (time: number): void => {
      mediaSynchronizer?.seekTo(time);
    },
    [mediaSynchronizer]
  );

  const setTrack = useCallback(
    (track: Partial<ExtendedMediaMetadata> | string | null): void => {
      // TODO: fix force unwrap once synchronizer uses correct types
      if (isExtendedMediaMetadata(track)) {
        mediaSynchronizer!.setTrack(track);
      } else if (typeof track === "string") {
        mediaSynchronizer!.setTrack({
          trackIdentifier: track,
        } as ExtendedMediaMetadata);
      }
    },
    [mediaSynchronizer]
  );

  // If a suspension is active, end it. Called when "Follow presenter" button is clicked.
  const endSuspension = useCallback(() => {
    suspension?.end();
    setSuspension(undefined);
  }, [suspension]);

  useEffect(() => {
    if (!container) return;
    console.log("EphemeralMediaSession dds on");
    const _uniqueKey = `<EphemeralMediaSession>:${uniqueKey}`;
    const registerDDS = () => {
      registerDDSSetStateAction(
        _uniqueKey,
        componentIdRef.current,
        EphemeralMediaSession,
        setMediaSession
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
      console.log("EphemeralMediaSession dds off");
      unregisterDDSSetStateAction(_uniqueKey, componentIdRef.current);
      container.off("connected", registerDDS);
    };
  }, [container]);

  useEffect(() => {
    if (listeningRef.current || !mediaSession || !mediaPlayerElementRef) return;
    // Query the HTML5 media element from the document and set initial src
    // Begin synchronizing a MediaSynchronizer for the player and set reference
    let mediaPlayer: IMediaPlayer | undefined;
    if (isRefObject<IMediaPlayer>(mediaPlayerElementRef)) {
      if (mediaPlayerElementRef.current) {
        mediaPlayer = mediaPlayerElementRef.current;
      } else {
        return;
      }
    } else {
      const mediaPlayerElement = document.getElementById(
        mediaPlayerElementRef
      ) as any;
      if (isMediaElement(mediaPlayerElement)) {
        mediaPlayer = mediaPlayerElement;
      } else {
        return;
      }
    }
    if (initialTrack) {
      if (isExtendedMediaMetadata(initialTrack)) {
        mediaPlayer.src = initialTrack.trackIdentifier;
      } else if (typeof initialTrack === "string") {
        mediaPlayer.src = initialTrack;
      }
    }
    const synchronizer = mediaSession.synchronize(mediaPlayer);
    listeningRef.current = true;
    if (viewOnly !== undefined) {
      synchronizer.viewOnly = viewOnly;
    }

    if (!mediaSession.isStarted) {
      // Start synchronizing the media session
      mediaSession.start(allowedRoles ?? []);
    } else if (initialTrack) {
      if (isExtendedMediaMetadata(initialTrack)) {
        synchronizer.setTrack(initialTrack);
      } else if (typeof initialTrack === "string") {
        synchronizer.setTrack({
          trackIdentifier: initialTrack,
        } as ExtendedMediaMetadata);
      }
    }
    console.log("mediaSynchronizer on");
    setMediaSynchronizer(synchronizer);

    return () => {
      listeningRef.current = false;
      console.log("mediaSynchronizer off");
      mediaSession.removeAllListeners();
      synchronizer?.end();
    };
  }, [mediaSession]);

  useEffect(() => {
    if (
      mediaSynchronizer &&
      viewOnly !== undefined &&
      mediaSynchronizer.viewOnly !== viewOnly
    ) {
      mediaSynchronizer.viewOnly = !!viewOnly;
    }
  }, [viewOnly, mediaSynchronizer]);

  return {
    suspended: !!suspension,
    mediaSynchronizer,
    play,
    pause,
    seekTo,
    setTrack,
    endSuspension,
  };
}
