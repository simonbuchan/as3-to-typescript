export function startsWith(string: string, prefix: string) {
    return string.substring(0, prefix.length) === prefix;
}


export function endsWith(string: string, suffix: string) {
    return string.substr(-suffix.length) === suffix;
}
