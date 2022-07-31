import { PresenceState } from "@microsoft/live-share";
import { useEphemeralPresence } from "@microsoft/live-share-react";

interface IMyCustomUserData {
  name?: string;
}

export const ExampleEphemeralPresence = () => {
  const { localUser, allUsers, updatePresence } =
    useEphemeralPresence<IMyCustomUserData>();
  return (
    <div style={{ padding: "24px 12px" }}>
      <h2>{"Users:"}</h2>
      <div>
        {allUsers.map((user) => (
          <div
            key={user.userId}
            style={{
              color: user?.state === "offline" ? "red" : "green",
            }}
          >{`${user.userId} local: ${user.isLocalUser}`}</div>
        ))}
      </div>
      <button
        onClick={() => {
          updatePresence(
            localUser?.state === PresenceState.offline
              ? PresenceState.online
              : PresenceState.offline
          );
        }}
      >
        {`Go ${
          localUser?.state === PresenceState.offline ? "Online" : "Offline"
        }`}
      </button>
    </div>
  );
};
