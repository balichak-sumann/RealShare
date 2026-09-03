declare module 'firebase/storage' {
  export function getStorage(app?: any): any;
  export function ref(storage: any, path?: string): any;
  export function uploadBytes(ref: any, data: any, metadata?: any): Promise<any>;
  export function uploadBytesResumable(ref: any, data: any, metadata?: any): any;
  export function getDownloadURL(ref: any): Promise<string>;
  export function deleteObject(ref: any): Promise<void>;
  export type StorageReference = any;
  export type FirebaseStorage = any;
  export type UploadTask = any;
  export type UploadTaskSnapshot = any;
}
