import { createUploadUrl } from "./procedures/create-upload-url";
import { deleteDocument } from "./procedures/delete-document";
import { listDocuments } from "./procedures/list-documents";

export const documentsRouter = {
	createUploadUrl,
	list: listDocuments,
	delete: deleteDocument,
};
