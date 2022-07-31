import { UserMeetingRole } from "@microsoft/live-share";
import { FC, useCallback, useEffect, useRef } from "react";
import { useMediaSynchronizer } from "@microsoft/live-share-react";

const ALLOWED_ROLES = [UserMeetingRole.organizer, UserMeetingRole.presenter];

const INITIAL_TRACK =
  "https://storage.googleapis.com/media-session/big-buck-bunny/trailer.mov";

export const ExampleMediaSynchronizer: FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { mediaSynchronizer, play, pause } = useMediaSynchronizer(
    "MEDIA-SESSION-ID",
    videoRef,
    INITIAL_TRACK,
    ALLOWED_ROLES
  );

  useEffect(() => {
    // TODO: remove this once MediaPlayerSynchronizer adheres to promise
    // spec of play, pause, etc.
    if (mediaSynchronizer && !mediaSynchronizer.player.muted) {
      mediaSynchronizer.player.muted = true;
    }
  }, [mediaSynchronizer]);

  const onTogglePlayPause = useCallback(() => {
    console.log("onClickTogglePlayPause", videoRef.current?.paused);
    if (videoRef.current?.paused) {
      play().catch((_) => {
        if (mediaSynchronizer && mediaSynchronizer.player.paused) {
          // Was unable to play, probably because of autoplay policy
          mediaSynchronizer.player.muted = true;
          play();
        }
      });
    } else {
      pause();
    }
  }, [play, pause, mediaSynchronizer]);

  return (
    <>
      <div>
        <video
          ref={videoRef}
          poster="https://images4.alphacoders.com/247/247356.jpg"
          height={9 * 40}
          width={16 * 40}
        />
        <div
          className="flex row hAlign vAlign wrap"
          style={{ marginTop: "8px" }}
        >
          <button onClick={onTogglePlayPause}>{"Play/pause"}</button>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
              }
            }}
          >
            {"Mute/unmute"}
          </button>
        </div>
      </div>
    </>
  );
};
