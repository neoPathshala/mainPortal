import "server-only";
import { db } from './db';
import { createCommunityDatabaseStorage } from "@/lib/platform/community/database-storage";
const store=createCommunityDatabaseStorage(db);
export const {readSupport,writeSupport,readFeedback,writeFeedback,listFeedback,saveCommunityFile,readCommunityFile,removeCommunityFile,readSupportReceipt,writeSupportReceipt,listSupportReceipts,eraseFeedbackIdentity,eraseSupportReceipts}=store;
