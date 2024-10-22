import { RootState, store } from "@/store/store";

export interface SubscribeOptions {
    immediate?: boolean // if true, the listener will be called immediately with the current value
}

export function subscribe<T>(selector: (state: RootState) => T, listener: (value: T) => void, options: SubscribeOptions = {}) {
    if(options.immediate) {
        listener(selector(store.getState()))
    }

    let oldProperty: null | T = null
    return store.subscribe(() => {
        const property = selector(store.getState())
        if(property !== oldProperty) {
            oldProperty = property
            listener(property)
        }
    })
}