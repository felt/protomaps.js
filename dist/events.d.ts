export declare type EventHandler = (...args: any[]) => void;
export declare enum ProtomapsEvent {
    TileFetchStart = "tile-fetch-start",
    TileFetchEnd = "tile-fetch-end",
    RerenderStart = "rerender-start",
    RerenderEnd = "rerender-end"
}
export declare class EventQueue {
    subs: Record<string, EventHandler[]>;
    constructor();
    subscribe(eventName: ProtomapsEvent, handler: EventHandler): void;
    publish(eventName: ProtomapsEvent, ...args: any[]): void;
}
