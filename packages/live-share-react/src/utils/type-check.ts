import {
  ExtendedMediaMetadata,
  IMediaPlayer,
} from "@microsoft/live-share-media";
import { RefObject } from "react";

export function isRefObject<T>(value: any): value is RefObject<T> {
  return value.current === null || !!value.current;
}

export function isMediaElement(value: any): value is IMediaPlayer {
  if (value) {
    return (
      value.currentSrc !== undefined &&
      value.currentTime !== undefined &&
      value.duration !== undefined &&
      value.ended !== undefined &&
      value.muted !== undefined &&
      value.paused !== undefined &&
      value.playbackRate !== undefined &&
      value.src !== undefined &&
      value.volume !== undefined &&
      value.load !== undefined &&
      value.pause !== undefined &&
      value.play !== undefined &&
      value.addEventListener !== undefined &&
      value.removeEventListener !== undefined
    );
  }
  return false;
}

export function isExtendedMediaMetadata(
  value: any
): value is ExtendedMediaMetadata {
  return value === null || !!value?.trackIdentifier;
}

export function isMap(value: any): value is Map<string, any> {
  return value instanceof Map;
}

export function isEntries(
  value: any
): value is readonly (readonly [string, any])[] {
  try {
    const tryValue = value as readonly (readonly [any, any])[];
    if (typeof tryValue[0][0] === "string") {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function isJSON(value: any): value is { [key: string]: any } {
  try {
    const tryValue = value as { [key: string]: any };
    return Object.keys(tryValue).length > 0;
  } catch (error) {
    return false;
  }
}