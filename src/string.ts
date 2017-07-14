export function startsWith(string: string, prefix: string): boolean {
    return string.substring(0, prefix.length) === prefix;
}


export function endsWith(string: string, suffix: string): boolean {
    return string.substr(-suffix.length) === suffix;
}
