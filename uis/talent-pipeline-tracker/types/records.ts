import type { EntityId, JsonObject } from "./api";

export type RecordItem = JsonObject;

export interface CandidateRecord extends JsonObject {
	id: EntityId;
	full_name: string;
	email?: string;
	phone?: string;
	position: string;
	linkedin_url?: string | null;
	cv_url?: string;
	experience_years?: number | string;
	status: string;
	stage: string;
	applied_at?: string;
	notes?: RecordNote[];
}

export interface RecordNote extends JsonObject {
	id: EntityId;
	record_id?: EntityId;
	content: string;
	created_at?: string;
}

export type CreateRecordPayload = JsonObject;

export type ReplaceRecordPayload = JsonObject;

export type UpdateRecordPayload = JsonObject;

export interface CreateNotePayload extends JsonObject {
	content: string;
}
