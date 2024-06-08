export const toMilliSeconds = (seconds: number | undefined) => {
    if (seconds === undefined) {
        return undefined
    } 
    return seconds * 1000
} 