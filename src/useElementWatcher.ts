import { useEffect, useRef } from "react";
import { querySelectorAsync, getObjectHash } from "./utils";

type OriginalStyles = {
    zIndex: string
    pointerEvents: string
}

type WatcherCallbacks = {
    onWatch?: (element: Element) => void
    onUnwatch?: (element: Element, originalStyles?: OriginalStyles) => void
}

type WatcherSet = {
    callbacks: WatcherCallbacks
    element: Element
    // used to reset styles back to their original styles on unwatch
    originalStyles?: OriginalStyles
}

export function useElementWatcher() {
    // watched elements that were provided as HTMLElement objects
    const elementSet = useRef(new Set<WatcherSet>());
    // watched elements that were provided as selector strings
    const selectorMap = useRef<{[key: string]: WatcherSet}>({});

    /**
     * Watches an element by object or selector
     * @param target
     * @param callbacks
     */
    const watchElement = (target: Element | string, callbacks: WatcherCallbacks) => {
        (async () => {
            // if an object is provided, just store it and fire the onWatch callback
            if (typeof target !== 'string') {
                // remember element so it can be unwatched
                elementSet.current.add({
                    element: target,
                    callbacks,
                });

                if (callbacks.onWatch) {
                    callbacks.onWatch(target);
                }
            } else {
                // find element in the dom by selector string
                const result = await querySelectorAsync(target);

                result.forEach((element: Element|HTMLElement) => {
                    const uniqueTarget = target + '-' + getObjectHash(element.id === '' ? ('innerText' in element ? element.innerText : '') : element.id);

                    // if there is already a stored element for this selected, unwatch the old one first
                    if (uniqueTarget in selectorMap.current && selectorMap.current[uniqueTarget].element !== element) {
                        if (selectorMap.current[uniqueTarget].callbacks.onUnwatch) {
                            // @ts-ignore
                            selectorMap.current[uniqueTarget].callbacks.onUnwatch(selectorMap.current[uniqueTarget].element);
                        }
                    }

                    // remember element so it can be unwatched
                    selectorMap.current[uniqueTarget] = {
                        element,
                        callbacks,
                        // stash styles before any modifications have been made
                        originalStyles: uniqueTarget in selectorMap.current
                            ? selectorMap.current[uniqueTarget].originalStyles
                            : {
                                zIndex: window.getComputedStyle(element).zIndex,
                                pointerEvents: window.getComputedStyle(element).pointerEvents,
                            }
                    }

                    if (callbacks.onWatch) {
                        callbacks.onWatch(element);
                    }
                });
            }
        })();
    }

    // unwatch and call the onUnwatch callback for all watched elements
    const unWatchAll = () => {
        const set = elementSet.current;
        const map = selectorMap.current;

        // unwatch object based elements
        set.forEach(item => {
            if (item.callbacks.onUnwatch) {
                item.callbacks.onUnwatch(item.element);
            }
        });

        // unwatch selector based elements
        Object.values(map).forEach(item => {
            if (item.callbacks.onUnwatch) {
                item.callbacks.onUnwatch(item.element, item.originalStyles);
            }
        });
    }

    // call unWatch callbacks to clean-up on unmount
    useEffect(() => () => {
        unWatchAll();
    }, []);

    return {
        watchElement,
        unWatchAll,
    }
}