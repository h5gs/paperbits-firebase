import { FirebaseObjectStorage } from "./firebaseObjectStorage";
import { FirebaseBlobStorage } from "./firebaseBlobStorage";
import { FirebaseService } from "./firebaseService";
import { FirebaseUserService } from "./firebaseUserService";
import { OfflineObjectStorage } from "@paperbits/common/persistence/offlineObjectStorage";
import { IInjector, IInjectorModule } from "@paperbits/common/injection";
import { IObjectStorage } from "@paperbits/common/persistence/IObjectStorage";
import { FirebaseAdminObjectStorage } from "./firebaseAdminObjectStorage";
import { FirebaseAdminBlobStorage } from "./firebaseAdminBlobStorage";
import { FirebaseAdminService } from "./firebaseAdminService";

export class FirebaseModule implements IInjectorModule {
    constructor() {
        this.register = this.register.bind(this);
    }

    public register(injector: IInjector): void {
        injector.bindSingleton("firebaseAdminService", FirebaseAdminService);
        injector.bindSingleton("adminBlobStorage", FirebaseAdminBlobStorage);
        injector.bindSingleton("adminObjectStorage", FirebaseAdminObjectStorage);
    }
}