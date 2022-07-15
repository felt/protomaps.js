export type EventHandler = (...args: any[]) => void;

export enum ProtomapsEvent {
  TileFetchStart = "tile-fetch-start",
  TileFetchEnd = "tile-fetch-end",
  RerenderStart = "rerender-start",
  RerenderEnd = "rerender-end",
  DataSourcesUpdated = "data-sources-updated",
}

export class EventQueue {
  subs: Record<string, EventHandler[]>;

  constructor() {
    this.subs = {};
  }

  subscribe(eventName: ProtomapsEvent, handler: EventHandler): void {
    this.subs[eventName] = this.subs[eventName] || [];
    this.subs[eventName].push(handler);
  }

  publish(eventName: ProtomapsEvent, ...args: any[]) {
    (this.subs[eventName] || []).forEach((sub) => sub(...args));
  }
}
