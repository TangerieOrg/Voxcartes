type EventCallback<T extends any[] = any[]> = (...args : T) => any;

export default class EventEmitter<TEventMap extends Record<string, any[]>> {
    private events : Record<keyof TEventMap, EventCallback[]> = {} as  Record<keyof TEventMap, EventCallback[]>;

    public on<K extends keyof TEventMap>(eventName : K, listener : EventCallback<TEventMap[K]>) {
        if(!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName]!.push(listener);
        return () => this.remove(eventName, listener);
    }

    public emit<K extends keyof TEventMap>(eventName : K, ...args : TEventMap[K]) {
        this.events[eventName]?.forEach(x => x(...args));
    }

    public remove<K extends keyof TEventMap>(eventName : K, listener : EventCallback<TEventMap[K]>) {
        if(this.events[eventName]) this.events[eventName].splice(this.events[eventName].indexOf(listener), 1)
    }
}