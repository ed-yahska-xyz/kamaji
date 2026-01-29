
class InvalidPath extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidPath"
    }
}

export {
    InvalidPath,
}