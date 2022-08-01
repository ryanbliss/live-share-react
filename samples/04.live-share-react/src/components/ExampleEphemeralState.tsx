import { FC, ReactNode } from "react";
import { useEphemeralState } from "@microsoft/live-share-react";
import { EphemeralEvent, UserMeetingRole } from "@microsoft/live-share";

enum ExampleAppState {
  WAITING = "WAITING",
  START = "START",
}

interface IExampleData {
  timeStarted: number;
}

const ALLOWED_ROLES = [
  UserMeetingRole.organizer,
  UserMeetingRole.presenter,
  UserMeetingRole.attendee,
];

interface IExampleEphemeralStateProps {
  waitingContent: ReactNode;
  startContent: ReactNode;
}

export const ExampleEphemeralState: FC<IExampleEphemeralStateProps> = (
  props
) => {
  const [state, data, setState] = useEphemeralState<
    ExampleAppState,
    IExampleData
  >("CUSTOM-STATE-ID", ALLOWED_ROLES, ExampleAppState.WAITING);

  if (state === ExampleAppState.WAITING) {
    return (
      <div style={{ padding: "12px 12px" }}>
        <div className="flex row">
          <h2>{`Start round:`}</h2>
          <button
            onClick={() => {
              setState(ExampleAppState.START, {
                timeStarted: EphemeralEvent.getTimestamp(),
              });
            }}
          >
            {"Start"}
          </button>
        </div>
        <h1>{"Welcome to Fluid React!"}</h1>
        {props.waitingContent}
      </div>
    );
  }
  return (
    <div style={{ padding: "12px 12px" }}>
      <div className="flex row">
        <h2>{`Time started: ${data!.timeStarted}`}</h2>
        <button
          onClick={() => {
            setState(ExampleAppState.WAITING, undefined);
          }}
        >
          {"End"}
        </button>
      </div>
      {props.startContent}
    </div>
  );
};
