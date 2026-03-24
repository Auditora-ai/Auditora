import { createUploadUrl } from "./procedures/create-upload-url";
import { deleteDocument } from "./procedures/delete-document";
import { listDocuments } from "./procedures/list-documents";
import { updateDocument } from "./procedures/update-document";

export const documentsRouter = {
	createUploadUrl,
	list: listDocuments,
	update: updateDocument,
	delete: deleteDocument,
};
