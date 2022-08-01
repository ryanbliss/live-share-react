export interface IReceiveEphemeralEvent<TEvent extends object = object> {
  event: TEvent;
  local: boolean;
}
