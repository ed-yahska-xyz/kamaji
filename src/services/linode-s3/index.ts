import { InvalidPath } from "./errors";

/**
 * 
 * @param path: string
 * @throws
 */

export async function getNoteFromS3(path: string) {
    if (!path || path.length === 0) {
        throw new InvalidPath("Input path is invalid");
    }

}

export async function getDirectoriesFromPath(path: string) {
    if (!path || path.length === 0) {
        throw new InvalidPath("Input path is invalid");
    }
    try {
        const url = 'https://api.linode.com/v4/object-storage/buckets';
        const options = {method: 'GET', headers: {accept: 'application/json'}};

        fetch(url, options)
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.error(err));
    } catch (e) {
        throw(e);
    }
}

export default {
    services: {
        getNoteFromS3,
        getDirectoriesFromPath
    },
    errors: {
        InvalidPath
    }
}