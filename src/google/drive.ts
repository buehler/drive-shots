import googleapis = require('googleapis');

const promisify = require('util.promisify');
const drive = googleapis.drive('v3');

for (const category of Object.keys(drive)) {
    const obj = drive[category];
    for (const method of Object.keys(obj)) {
        obj[method] = promisify(obj[method]);
    }
}

export default drive;

// const mime = require('mime');

// export interface DriveUserInfo {
//     displayName: string;
//     usage: number;
//     unit: 'GB';
// }

// export function getDriveUserInfo(): Promise<DriveUserInfo> {
//     const drive = googleapis.drive('v3');
//     return new Promise((resolve, reject) => {
//         drive.about.get(
//             {
//                 fields: 'user,storageQuota',
//             },
//             (err, body) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 const usage = body.storageQuota.usage / 1024 / 1024 / 1024;
//                 resolve({
//                     displayName: body.user.displayName,
//                     usage: Math.round(usage * 100) / 100,
//                     unit: 'GB',
//                 });
//             },
//         );
//     });
// }

// export async function getDriveAppFolder(): Promise<string> {
//     const drive = googleapis.drive('v3');
//     let folderId = await new Promise<string | null>((resolve, reject) => {
//         drive.files.list(
//             {
//                 q: `mimeType = 'application/vnd.google-apps.folder' and ` +
//                     `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
//                 fields: 'files(id)',
//             },
//             (err, body) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 if (body.files.length <= 0) {
//                     resolve(null);
//                     return;
//                 }
//                 resolve(body.files[0].id || null);
//             },
//         );
//     });

//     if (!folderId) {
//         folderId = await new Promise<string>((resolve, reject) => {
//             drive.files.create(
//                 {
//                     resource: {
//                         name: 'DriveShots',
//                         mimeType: 'application/vnd.google-apps.folder',
//                         appProperties: {
//                             'drive-shots': 'drive-shots-folder',
//                         },
//                     },
//                     fields: 'id',
//                 },
//                 (err, file) => {
//                     if (err) {
//                         reject(err);
//                         return;
//                     }
//                     resolve(file.id);
//                 },
//             );
//         });
//     }

//     return folderId;
// }

// export function uploadFileToFolder(folderId: string, path: string): Promise<DriveShotsImage> {
//     const drive = googleapis.drive('v3');
//     const resource = {
//         name: `${moment().format('YYYY-MM-DDTHH:mm:ss')}-${randomBytes(4).toString('hex')}${parse(path).ext}`,
//         appProperties: {
//             'drive-shots': 'drive-shots-image',
//         },
//         parents: [folderId],
//     };
//     const media = {
//         mimeType: mime.getType(path),
//         body: createReadStream(path),
//     };
//     return new Promise((resolve, reject) => {
//         drive.files.create(
//             {
//                 resource,
//                 media,
//                 fields: 'id',
//             },
//             (err, file) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 resolve({
//                     name: resource.name,
//                     id: file.id,
//                 });
//             },
//         );
//     });
// }

// export async function shareDriveFile(image: DriveShotsImage): Promise<DriveShotsSharedImage> {
//     const drive = googleapis.drive('v3');
//     const shortener = googleapis.urlshortener('v1');

//     await new Promise((resolve, reject) => {
//         drive.permissions.create(
//             {
//                 fileId: image.id,
//                 resource: {
//                     type: 'anyone',
//                     role: 'reader',
//                     allowFileDiscovery: false,
//                 },
//             },
//             (err) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 resolve();
//             },
//         );
//     });

//     const longUrl = await new Promise<string>((resolve, reject) => {
//         drive.files.get(
//             {
//                 fileId: image.id,
//                 fields: 'id,name,webViewLink',
//             },
//             (err, body) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 resolve(body.webViewLink);
//             },
//         );
//     });

//     const shortUrl = await new Promise<string>((resolve, reject) => {
//         shortener.url.insert(
//             {
//                 resource: {
//                     longUrl,
//                 },
//             },
//             (err, body) => {
//                 if (err) {
//                     reject(err);
//                     return;
//                 }
//                 resolve(body.id);
//             },
//         );
//     });

//     return {
//         ...image,
//         url: shortUrl,
//     };
// }
