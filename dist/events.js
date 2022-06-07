export var ProtomapsEvent;
(function (ProtomapsEvent) {
    ProtomapsEvent["TileFetchStart"] = "tile-fetch-start";
    ProtomapsEvent["TileFetchEnd"] = "tile-fetch-end";
    ProtomapsEvent["RerenderStart"] = "rerender-start";
    ProtomapsEvent["RerenderEnd"] = "rerender-end";
})(ProtomapsEvent || (ProtomapsEvent = {}));
export class EventQueue {
    constructor() {
        this.subs = {};
    }
    subscribe(eventName, handler) {
        this.subs[eventName] = this.subs[eventName] || [];
        this.subs[eventName].push(handler);
    }
    publish(eventName, ...args) {
        (this.subs[eventName] || []).forEach((sub) => sub(...args));
    }
}
