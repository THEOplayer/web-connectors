export const toMilliSeconds = (seconds: number | undefined) => {
    if (seconds === undefined) {
        return undefined
    } 
    return Math.round(seconds * 1000)
} 