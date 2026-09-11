import type { EntityId, JsonObject } from "./api";

export type RecordItem = JsonObject;

export interface CandidateRecord {
	id: EntityId;
	full_name: string;
	name?: string;
	email?: string;
	phone?: string;
	position: string;
	linkedin_url?: string | null;
	linkedin?: string | null;
	cv_url?: string;
	experience_years?: number | string;
	years_experience?: number | string;
	status: string;
	stage: string;
	applied_at?: string;
	updated_at?: string;
	notes?: RecordNote[];
}

export interface RecordNote {
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
