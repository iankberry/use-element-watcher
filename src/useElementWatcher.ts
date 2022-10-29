import { useEffect, useRef } from "react";
import { getObjectHash, querySelectorAsync } from "./utils";

type WatcherCallbacks = {
    onWatch?: (element: HTMLElement) => void
    onUnwatch?: (element: HTMLElement, originalStyles: CSSStyleDeclaration) => void
}

type WatcherSet = {
    callbacks: WatcherCallbacks
    element: HTMLElement
    // used to reset styles back to their original styles on unwatch
    originalStyles: CSSStyleDeclaration
}

export function useElementWatcher() {
    // watched elements that were provided as HTMLElement objects
    const elementSet = useRef(new Set<WatcherSet>());
    // watched elements that were provided as selector strings
    const selectorMap = useRef<{[key: string]: WatcherSet}>({});

    /**
     * Watches an element by object or selector
     * @param target Target element selector or ref
     * @param callbacks Callbacks for watch/unwatch
     */
    const watchElement = (target: HTMLElement | string, callbacks: WatcherCallbacks) => {
        (async () => {
            // if an object is provided, just store it and fire the onWatch callback
            if (typeof target !== 'string') {
                // remember element so it can be unwatched
                elementSet.current.add({
                    element: target,
                    callbacks,
                    originalStyles: getPreservedStyles(target),
                });

                if (callbacks.onWatch) {
                    callbacks.onWatch(target);
                }
            } else {
                // find element in the dom by selector string
                const result = await querySelectorAsync(target);

                result.forEach((element: HTMLElement) => {
                    const uniqueTarget = target + '-' + getObjectHash(element.id === '' ? ('innerText' in element ? element.innerText : '') : element.id);

                    // if there is already a stored element for this selected, unwatch the old one first
                    if (uniqueTarget in selectorMap.current && selectorMap.current[uniqueTarget].element !== element) {
                        if (selectorMap.current[uniqueTarget].callbacks.onUnwatch) {
                            // @ts-ignore
                            selectorMap.current[uniqueTarget].callbacks.onUnwatch(selectorMap.current[uniqueTarget].element, selectorMap.current[uniqueTarget].originalStyles);
                        }
                    }

                    // remember element so it can be unwatched
                    selectorMap.current[uniqueTarget] = {
                        element,
                        callbacks,
                        // stash styles before any modifications have been made
                        originalStyles: uniqueTarget in selectorMap.current
                            ? selectorMap.current[uniqueTarget].originalStyles
                            : getPreservedStyles(element),
                    }

                    if (callbacks.onWatch) {
                        callbacks.onWatch(element);
                    }
                });
            }
        })();
    }

    /**
     * Unwatch and call the onUnwatch callback for all watched elements
     */
    const unWatchAll = () => {
        const set = elementSet.current;
        const map = selectorMap.current;

        // unwatch object based elements
        set.forEach(item => {
            if (item.callbacks.onUnwatch) {
                item.callbacks.onUnwatch(item.element, item.originalStyles);
            }
        });

        // unwatch selector based elements
        Object.values(map).forEach(item => {
            if (item.callbacks.onUnwatch) {
                item.callbacks.onUnwatch(item.element, item.originalStyles);
            }
        });
    }

    /**
     * Returns a new CSSStyleDeclaration object representing an element's styles
     * @param element
     */
    const getPreservedStyles = (element: HTMLElement): CSSStyleDeclaration => {
        const preservedStyles: {[key: string]: string|number} = {};
        const styles = window.getComputedStyle(element);

        Array.from(styles).forEach((property) => {
            preservedStyles[camelize(property)] = styles.getPropertyValue(property);
            preservedStyles[property] = styles.getPropertyValue(property);
        });

        return preservedStyles as unknown as CSSStyleDeclaration;
    }

    /**
     * Converts dashes to camelCase
     * @param text
     */
    const camelize = (text: string) =>
        text.replace(/-./g, (m) => m[1].toUpperCase())

    // call unWatch callbacks to clean-up on unmount
    useEffect(() => () => {
        unWatchAll();
    }, []);

    return {
        watchElement,
        unWatchAll,
    }
}