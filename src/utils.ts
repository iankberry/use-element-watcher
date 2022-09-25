// resolves when an element matching the specified selector is found
export function querySelectorAsync(selector: string): Promise<Element[]> {
    const result = document.querySelectorAll(selector);

    if (result && result.length > 0) {
        return Promise.resolve(Array.from(result));
    } else {
        return rafAsync()
            .then(() => querySelectorAsync(selector));
    }
}

function rafAsync() {
    return new Promise(resolve => {
        requestAnimationFrame(resolve);
    });
}

export function getObjectHash(object: unknown) {
    return hashCode(JSON.stringify(object));
}

function hashCode(str: string): string {
    let hash = 0, i = 0, len = str.length;
    while ( i < len ) {
        hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
    }
    return Math.abs(hash).toString();
}