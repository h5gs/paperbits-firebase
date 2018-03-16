import { IObjectStorage } from '@paperbits/common/persistence/IObjectStorage';
import { FirebaseService } from './firebaseService';
import * as _ from 'lodash';

export class FirebaseObjectStorage implements IObjectStorage {
    private readonly firebaseService: FirebaseService;

    constructor(firebaseService: FirebaseService) {
        this.firebaseService = firebaseService;
    }

    public async addObject<T>(path: string, dataObject: T): Promise<void> {
        try {
            const databaseRef = await this.firebaseService.getDatabaseRef();

            if (path) {
                await databaseRef.child(path).set(dataObject)
            }
            else {
                await databaseRef.update(dataObject);
            }
        }
        catch (error) {
            throw `Could not add object '${path}'. Error: ${error}.`;
        }
    }

    public async getObject<T>(path: string): Promise<T> {
        try {
            let databaseRef = await this.firebaseService.getDatabaseRef();
            let snapshot = await databaseRef.child(path).once("value");

            return snapshot.val();
        }
        catch (error) {
            throw `Could not retrieve object '${path}'. Error: ${error}.`;
        }
    }

    public async deleteObject(path: string): Promise<void> {
        try {
            let databaseRef = await this.firebaseService.getDatabaseRef();
            databaseRef.child(path).remove();
        }
        catch (error) {
            throw `Could not delete object '${path}'. Error: ${error}.`;
        }
    }

    public async updateObject<T>(path: string, dataObject: T): Promise<void> {
        try {
            let databaseRef = await this.firebaseService.getDatabaseRef();
            return await databaseRef.child(path).update(dataObject);
        }
        catch (error) {
            throw `Could not update object '${path}'. Error: ${error}`;
        }
    }

    public async searchObjects<T>(pattern: string, options?: Object): Promise<Array<T>> {
        const path = options["area"];
        const propertyNames = options["properties"];

        try {
            const databaseRef = await this.firebaseService.getDatabaseRef();
            const pathRef = databaseRef.child(path);

            if (propertyNames && propertyNames.length && pattern) {
                const searchPromises = propertyNames.map(async (propertyName) => {
                    const query = pathRef.orderByChild(propertyName).startAt(pattern)
                    const result = await query.once("value");

                    return this.collectResult(result);
                });

                const searchTaskResults = await Promise.all<any>(searchPromises);

                return _.flatten(searchTaskResults);
            }
            else {
                //return all objects
                const objectData = await pathRef.once("value");
                const result = this.collectResult(objectData);

                return result;
            }
        }
        catch (error) {
            throw `Could not search object '${path}'. Error: ${error}.`;
        }
    }

    private collectResult(objectData): Array<any> {
        let result = [];

        if (objectData.hasChildren()) {
            let items = objectData.val();

            if (items) {
                if (Array.isArray(items)) {
                    items.map((item) => result.push(item));
                }
                else {
                    _.map(items, (item) => result.push(item));
                }
            }
        }
        return result;
    };
}