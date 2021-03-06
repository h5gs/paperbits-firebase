import * as _ from 'lodash';
import * as Utils from "@paperbits/common/utils";
import { IObjectStorage } from '@paperbits/common/persistence/IObjectStorage';
import { FirebaseService } from './firebaseService';


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
            const databaseRef = await this.firebaseService.getDatabaseRef();
            const snapshot = await databaseRef.child(path).once("value");

            return snapshot.val();
        }
        catch (error) {
            throw `Could not retrieve object '${path}'. Error: ${error}.`;
        }
    }

    public async deleteObject(path: string): Promise<void> {
        try {
            const databaseRef = await this.firebaseService.getDatabaseRef();
            databaseRef.child(path).remove();
        }
        catch (error) {
            throw `Could not delete object '${path}'. Error: ${error}.`;
        }
    }

    public async updateObject<T>(path: string, dataObject: T): Promise<void> {
        try {
            const databaseRef = await this.firebaseService.getDatabaseRef();
            return await databaseRef.child(path).update(dataObject);
        }
        catch (error) {
            throw `Could not update object '${path}'. Error: ${error}`;
        }
    }

    public async searchObjects<T>(path: string, propertyNames?: Array<string>, searchValue?: string, startAtSearch?: boolean): Promise<Array<T>> {
        try {
            let databaseRef = await this.firebaseService.getDatabaseRef();
            let pathRef = databaseRef.child(path);

            if (propertyNames && propertyNames.length && searchValue) {
                var searchPromises = propertyNames.map(async (propertyName) => {
                    let query: firebase.database.Query = startAtSearch
                        ? pathRef.orderByChild(propertyName).startAt(searchValue)
                        : pathRef.orderByChild(propertyName).equalTo(searchValue);

                    let result = await query.once("value");
                    return this.collectResult(result);
                });

                let searchTaskResults = await Promise.all(searchPromises);
                return _.flatten(searchTaskResults);
            }
            else {
                //return all objects
                let objectData = await pathRef.once("value");
                let result = this.collectResult(objectData);
                return result;
            }
        }
        catch (error) {
            throw `Could not search object '${path}'. Error: ${error}.`;
        }
    }

    private collectResult(objectData): Array<any> {
        const result = [];

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

    public async saveChanges(delta: Object): Promise<void> {
        console.log("Saving changes...");

        const saveTasks = [];
        const keys = [];

        Object.keys(delta).map(key => {
            let firstLevelObject = delta[key];

            Object.keys(firstLevelObject).forEach(subkey => {
                keys.push(`${key}/${subkey}`);
            });
        })

        keys.forEach(key => {
            const changeObject = Utils.getObjectAt(key, delta);

            Utils.cleanupObject(changeObject);

            if (changeObject) {
                saveTasks.push(this.updateObject(key, changeObject));
            }
            else {
                saveTasks.push(this.deleteObject(key));
            }
        })

        await Promise.all(saveTasks);
    }
}