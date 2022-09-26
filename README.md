# use-element-watcher

> React hook to asynchronously watch for DOM elements on the page using a selector

The inspiration for this hook was from creating a tour library that required managing references to multiple elements on the page either for highlighting or anchoring purposes. There are several problems this library solves beyond just calling `document.querySelectorAll()` to obtain references to the elements.

- Many times the target elements are not yet in the DOM when the tour component was first rendered. This requires watching for the target elements to appear and emitting a callback with the element object.
- Since tour libraries often need to modify CSS attributes on the element (such as z-index), existing values need to be tracked so they can be restored when the element is unwatched.
- A callback needs to be emitted when an element object is no longer watched so any required cleanup can occur.

## Installation

```sh
npm install --save use-element-watcher
```

## Reference

### Inputs

This hook does not accept any input parameters.

### Outputs

This hook returns the following properties.

```
watchElement: (target: Element | string, callbacks: WatcherCallbacks) => void
unWatchAll: () => void
```

#### watchElement `function`
A function that accepts an element (via an object or selector string) and callbacks that will be emitted when the element is watched/unwatched on the page. It is recommended that you call this function on each render to maintain the element reference if it is re-created in the DOM.

#### unWatchAll `function`
A function that unwatches all elements registered with `watchElement`. The `onUnwatch` callback function will be emitted for each watched element when this is called. This function is also called when the component unmounts.

### Callback types

```typescript
type WatcherCallbacks = {
    onWatch?: (element: HTMLElement) => void
    onUnwatch?: (element: HTMLElement, originalStyles?: OriginalStyles) => void
}

type OriginalStyles = {
    zIndex: string
    pointerEvents: string
}
```

## Example

The following example sets up a watcher that changes the background color of 3 elements as they are rendered in the DOM. Note that this example is somewhat contrived since you would normally be watching elements elsewhere in the DOM tree. It would be much better to use refs if you were actually building a component in this way :-)

```jsx 
import React from "react";
import { useElementWatcher } from "use-element-watcher";

export default function App() {
    const [step, setStep] = React.useState(1);
    const { watchElement } = useElementWatcher();

    watchElement(".first-step", {
        onWatch: (element) => {
            // @ts-ignore
            element.style.backgroundColor = "red";
        }
    });

    watchElement(".second-step", {
        onWatch: (element) => {
            // @ts-ignore
            element.style.backgroundColor = "blue";
        }
    });

    watchElement(".third-step", {
        onWatch: (element) => {
            // @ts-ignore
            element.style.backgroundColor = "green";
        }
    });

    return (
        <div>
            {step === 1 && <div className="first-step">First step!</div>}
            {step === 2 && <div className="second-step">Second step!</div>}
            {step === 3 && <div className="third-step">Third step!</div>}

            <button
                onClick={() => setStep((step) => (step >= 3 ? 1 : step + 1))}
                style={{ marginTop: "20px" }}
            >
                Next step
            </button>
        </div>
    );
}

```

## Known limitations

- The library attempts to calculate a unique "id" for each watched element when using a selector so it knows when to cleanup as the DOM changes. Since there is no builtin concept of a unique element id in JS, it may not be 100% reliable. I would recommend adding HTML `id` attributes to watched elements to avoid this issue.
- Only the `z-index` and `pointer-events` CSS properties are tracked for libraries that modify the styles of watched elements. This could easily be extended to additional properties or even all CSS properties (if possible without a large performance penalty).

## Note

Feel free to submit issues/PR's and I will do my best to respond.

## License

This project is licensed under the terms of the [MIT license](https://github.com/iankberry/react-crossfade-simple/blob/master/LICENSE).