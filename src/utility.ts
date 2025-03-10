export function raise_error(error: string) {
    throw new Error(error);
}

// Get an optional string key with a default value
// Also checks that the value is within the allowed options
// The default value is the first element of the options list
export function get_default(obj: any, key: string, options: string[]): string {
    const value = obj[key] ?? options[0];

    if (options.indexOf(value) == -1) {
        throw new Error(`${key} must be one of ${options}`);
    }

    return value;
}

// Get a required key
export function get_required(obj: any, key: string): any {
    return obj[key] ?? raise_error(`missing required key '${key}'`);
}
