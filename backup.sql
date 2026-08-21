--
-- PostgreSQL database dump
--

\restrict dmn8a7MIJvNT1hXPL99b99X99D233gmVefvxH5BoO0EXdq4sqz7OmCBcszhqQlF

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER pgrst_drop_watch;
DROP EVENT TRIGGER pgrst_ddl_watch;
DROP EVENT TRIGGER issue_pg_net_access;
DROP EVENT TRIGGER issue_pg_graphql_access;
DROP EVENT TRIGGER issue_pg_cron_access;
DROP EVENT TRIGGER issue_graphql_placeholder;
DROP PUBLICATION supabase_realtime;
ALTER TABLE ONLY storage.vector_indexes DROP CONSTRAINT vector_indexes_bucket_id_fkey;
ALTER TABLE ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey;
ALTER TABLE ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey;
ALTER TABLE ONLY storage.s3_multipart_uploads DROP CONSTRAINT s3_multipart_uploads_bucket_id_fkey;
ALTER TABLE ONLY storage.objects DROP CONSTRAINT "objects_bucketId_fkey";
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_subject_id_subjects_id_fk;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_student_id_students_id_fk;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_requested_by_guardian_id_guardians_id_fk;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_preferred_slot_id_availability_slots_id_fk;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_policy_version_id_policy_versions_id_fk;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_household_id_households_id_fk;
ALTER TABLE ONLY public.tutor_subjects DROP CONSTRAINT tutor_subjects_tutor_id_tutors_id_fk;
ALTER TABLE ONLY public.tutor_subjects DROP CONSTRAINT tutor_subjects_subject_id_subjects_id_fk;
ALTER TABLE ONLY public.tutor_notes DROP CONSTRAINT tutor_notes_tutor_id_fkey;
ALTER TABLE ONLY public.tutor_notes DROP CONSTRAINT tutor_notes_editor_staff_id_fkey;
ALTER TABLE ONLY public.tutor_notes DROP CONSTRAINT tutor_notes_deleted_by_staff_id_fkey;
ALTER TABLE ONLY public.tutor_notes DROP CONSTRAINT tutor_notes_author_staff_id_fkey;
ALTER TABLE ONLY public.students DROP CONSTRAINT students_household_id_households_id_fk;
ALTER TABLE ONLY public.student_subjects DROP CONSTRAINT student_subjects_subject_id_fkey;
ALTER TABLE ONLY public.student_subjects DROP CONSTRAINT student_subjects_student_id_fkey;
ALTER TABLE ONLY public.student_notes DROP CONSTRAINT student_notes_student_id_fkey;
ALTER TABLE ONLY public.student_notes DROP CONSTRAINT student_notes_editor_staff_id_fkey;
ALTER TABLE ONLY public.student_notes DROP CONSTRAINT student_notes_deleted_by_staff_id_fkey;
ALTER TABLE ONLY public.student_notes DROP CONSTRAINT student_notes_author_staff_id_fkey;
ALTER TABLE ONLY public.price_book_lines DROP CONSTRAINT price_book_lines_price_book_id_fkey;
ALTER TABLE ONLY public.payment_records DROP CONSTRAINT payment_records_recorded_by_staff_id_staff_profiles_id_fk;
ALTER TABLE ONLY public.payment_records DROP CONSTRAINT payment_records_household_id_households_id_fk;
ALTER TABLE ONLY public.identity_merge_requests DROP CONSTRAINT identity_merge_requests_target_household_id_fkey;
ALTER TABLE ONLY public.identity_merge_requests DROP CONSTRAINT identity_merge_requests_source_household_id_fkey;
ALTER TABLE ONLY public.household_notes DROP CONSTRAINT household_notes_household_id_fkey;
ALTER TABLE ONLY public.household_notes DROP CONSTRAINT household_notes_editor_staff_id_fkey;
ALTER TABLE ONLY public.household_notes DROP CONSTRAINT household_notes_deleted_by_staff_id_fkey;
ALTER TABLE ONLY public.household_notes DROP CONSTRAINT household_notes_author_staff_id_fkey;
ALTER TABLE ONLY public.guardians DROP CONSTRAINT guardians_household_id_households_id_fk;
ALTER TABLE ONLY public.guardian_notes DROP CONSTRAINT guardian_notes_guardian_id_fkey;
ALTER TABLE ONLY public.guardian_notes DROP CONSTRAINT guardian_notes_editor_staff_id_fkey;
ALTER TABLE ONLY public.guardian_notes DROP CONSTRAINT guardian_notes_deleted_by_staff_id_fkey;
ALTER TABLE ONLY public.guardian_notes DROP CONSTRAINT guardian_notes_author_staff_id_fkey;
ALTER TABLE ONLY public.course_offerings DROP CONSTRAINT course_offerings_policy_version_id_policy_versions_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_student_id_students_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_requested_by_guardian_id_guardians_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_price_snapshot_id_price_snapshots_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_policy_version_id_policy_versions_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_household_id_households_id_fk;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_course_offering_id_course_offerings_id_fk;
ALTER TABLE ONLY public.consent_evidence DROP CONSTRAINT consent_evidence_policy_version_id_policy_versions_id_fk;
ALTER TABLE ONLY public.consent_evidence DROP CONSTRAINT consent_evidence_household_id_households_id_fk;
ALTER TABLE ONLY public.consent_evidence DROP CONSTRAINT consent_evidence_guardian_id_guardians_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_tutoring_request_id_tutoring_requests_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_tutor_id_tutors_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_subject_id_subjects_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_student_id_students_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_slot_id_availability_slots_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_price_snapshot_id_price_snapshots_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_policy_version_id_policy_versions_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_household_id_households_id_fk;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_confirmed_by_staff_id_staff_profiles_id_fk;
ALTER TABLE ONLY public.availability_slots DROP CONSTRAINT availability_slots_tutor_id_tutors_id_fk;
ALTER TABLE ONLY auth.webauthn_credentials DROP CONSTRAINT webauthn_credentials_user_id_fkey;
ALTER TABLE ONLY auth.webauthn_challenges DROP CONSTRAINT webauthn_challenges_user_id_fkey;
ALTER TABLE ONLY auth.sso_domains DROP CONSTRAINT sso_domains_sso_provider_id_fkey;
ALTER TABLE ONLY auth.sessions DROP CONSTRAINT sessions_user_id_fkey;
ALTER TABLE ONLY auth.sessions DROP CONSTRAINT sessions_oauth_client_id_fkey;
ALTER TABLE ONLY auth.saml_relay_states DROP CONSTRAINT saml_relay_states_sso_provider_id_fkey;
ALTER TABLE ONLY auth.saml_relay_states DROP CONSTRAINT saml_relay_states_flow_state_id_fkey;
ALTER TABLE ONLY auth.saml_providers DROP CONSTRAINT saml_providers_sso_provider_id_fkey;
ALTER TABLE ONLY auth.refresh_tokens DROP CONSTRAINT refresh_tokens_session_id_fkey;
ALTER TABLE ONLY auth.one_time_tokens DROP CONSTRAINT one_time_tokens_user_id_fkey;
ALTER TABLE ONLY auth.oauth_consents DROP CONSTRAINT oauth_consents_user_id_fkey;
ALTER TABLE ONLY auth.oauth_consents DROP CONSTRAINT oauth_consents_client_id_fkey;
ALTER TABLE ONLY auth.oauth_authorizations DROP CONSTRAINT oauth_authorizations_user_id_fkey;
ALTER TABLE ONLY auth.oauth_authorizations DROP CONSTRAINT oauth_authorizations_client_id_fkey;
ALTER TABLE ONLY auth.mfa_factors DROP CONSTRAINT mfa_factors_user_id_fkey;
ALTER TABLE ONLY auth.mfa_challenges DROP CONSTRAINT mfa_challenges_auth_factor_id_fkey;
ALTER TABLE ONLY auth.mfa_amr_claims DROP CONSTRAINT mfa_amr_claims_session_id_fkey;
ALTER TABLE ONLY auth.identities DROP CONSTRAINT identities_user_id_fkey;
DROP TRIGGER update_objects_updated_at ON storage.objects;
DROP TRIGGER protect_objects_delete ON storage.objects;
DROP TRIGGER protect_buckets_delete ON storage.buckets;
DROP TRIGGER enforce_bucket_name_length_trigger ON storage.buckets;
DROP TRIGGER tr_check_filters ON realtime.subscription;
DROP INDEX storage.vector_indexes_name_bucket_id_idx;
DROP INDEX storage.name_prefix_search;
DROP INDEX storage.idx_objects_bucket_id_name_lower;
DROP INDEX storage.idx_objects_bucket_id_name;
DROP INDEX storage.idx_multipart_uploads_list;
DROP INDEX storage.buckets_analytics_unique_name_idx;
DROP INDEX storage.bucketid_objname;
DROP INDEX storage.bname;
DROP INDEX realtime.subscription_subscription_id_entity_filters_action_filter_selec;
DROP INDEX realtime.messages_inserted_at_topic_index;
DROP INDEX realtime.ix_realtime_subscription_entity;
DROP INDEX public.tutoring_requests_status_idx;
DROP INDEX public.tutoring_requests_household_id_idx;
DROP INDEX public.tutor_subjects_tutor_subject_uidx;
DROP INDEX public.tutor_subjects_tutor_id_subject_id_uidx;
DROP INDEX public.tutor_notes_tutor_id_idx;
DROP INDEX public.tutor_notes_deleted_at_idx;
DROP INDEX public.subjects_code_uidx;
DROP INDEX public.students_household_id_idx;
DROP INDEX public.student_subjects_student_id_subject_id_uidx;
DROP INDEX public.student_notes_student_id_idx;
DROP INDEX public.student_notes_deleted_at_idx;
DROP INDEX public.staff_profiles_clerk_user_id_uidx;
DROP INDEX public.price_books_status_idx;
DROP INDEX public.price_book_lines_book_idx;
DROP INDEX public.policy_versions_code_version_uidx;
DROP INDEX public.payment_records_related_idx;
DROP INDEX public.payment_records_household_id_idx;
DROP INDEX public.integration_outbox_status_idx;
DROP INDEX public.integration_outbox_idempotency_uidx;
DROP INDEX public.integration_inbox_provider_event_uidx;
DROP INDEX public.identity_merge_requests_status_idx;
DROP INDEX public.identity_merge_requests_created_at_idx;
DROP INDEX public.household_notes_household_created_idx;
DROP INDEX public.household_notes_deleted_at_idx;
DROP INDEX public.guardians_household_parent_2_uidx;
DROP INDEX public.guardians_household_parent_1_uidx;
DROP INDEX public.guardians_household_id_idx;
DROP INDEX public.guardians_clerk_user_id_uidx;
DROP INDEX public.guardian_notes_guardian_created_idx;
DROP INDEX public.guardian_notes_deleted_at_idx;
DROP INDEX public.feature_flags_key_uidx;
DROP INDEX public.course_enrollments_household_id_idx;
DROP INDEX public.course_enrollments_course_id_idx;
DROP INDEX public.change_requests_related_idx;
DROP INDEX public.change_requests_household_idx;
DROP INDEX public.cancellation_policy_versions_kind_status_idx;
DROP INDEX public.bookings_status_idx;
DROP INDEX public.bookings_slot_id_idx;
DROP INDEX public.bookings_household_id_idx;
DROP INDEX public.availability_slots_tutor_id_idx;
DROP INDEX public.audit_events_household_id_idx;
DROP INDEX public.audit_events_entity_idx;
DROP INDEX public.audit_events_created_at_idx;
DROP INDEX auth.webauthn_credentials_user_id_idx;
DROP INDEX auth.webauthn_credentials_credential_id_key;
DROP INDEX auth.webauthn_challenges_user_id_idx;
DROP INDEX auth.webauthn_challenges_expires_at_idx;
DROP INDEX auth.users_is_anonymous_idx;
DROP INDEX auth.users_instance_id_idx;
DROP INDEX auth.users_instance_id_email_idx;
DROP INDEX auth.users_email_partial_key;
DROP INDEX auth.user_id_created_at_idx;
DROP INDEX auth.unique_phone_factor_per_user;
DROP INDEX auth.sso_providers_resource_id_pattern_idx;
DROP INDEX auth.sso_providers_resource_id_idx;
DROP INDEX auth.sso_domains_sso_provider_id_idx;
DROP INDEX auth.sso_domains_domain_idx;
DROP INDEX auth.sessions_user_id_idx;
DROP INDEX auth.sessions_oauth_client_id_idx;
DROP INDEX auth.sessions_not_after_idx;
DROP INDEX auth.saml_relay_states_sso_provider_id_idx;
DROP INDEX auth.saml_relay_states_for_email_idx;
DROP INDEX auth.saml_relay_states_created_at_idx;
DROP INDEX auth.saml_providers_sso_provider_id_idx;
DROP INDEX auth.refresh_tokens_updated_at_idx;
DROP INDEX auth.refresh_tokens_session_id_revoked_idx;
DROP INDEX auth.refresh_tokens_parent_idx;
DROP INDEX auth.refresh_tokens_instance_id_user_id_idx;
DROP INDEX auth.refresh_tokens_instance_id_idx;
DROP INDEX auth.recovery_token_idx;
DROP INDEX auth.reauthentication_token_idx;
DROP INDEX auth.one_time_tokens_user_id_token_type_key;
DROP INDEX auth.one_time_tokens_token_hash_hash_idx;
DROP INDEX auth.one_time_tokens_relates_to_hash_idx;
DROP INDEX auth.oauth_consents_user_order_idx;
DROP INDEX auth.oauth_consents_active_user_client_idx;
DROP INDEX auth.oauth_consents_active_client_idx;
DROP INDEX auth.oauth_clients_deleted_at_idx;
DROP INDEX auth.oauth_auth_pending_exp_idx;
DROP INDEX auth.mfa_factors_user_id_idx;
DROP INDEX auth.mfa_factors_user_friendly_name_unique;
DROP INDEX auth.mfa_challenge_created_at_idx;
DROP INDEX auth.idx_users_name;
DROP INDEX auth.idx_users_last_sign_in_at_desc;
DROP INDEX auth.idx_users_email;
DROP INDEX auth.idx_users_created_at_desc;
DROP INDEX auth.idx_user_id_auth_method;
DROP INDEX auth.idx_oauth_client_states_created_at;
DROP INDEX auth.idx_auth_code;
DROP INDEX auth.identities_user_id_idx;
DROP INDEX auth.identities_email_idx;
DROP INDEX auth.flow_state_created_at_idx;
DROP INDEX auth.factor_id_created_at_idx;
DROP INDEX auth.email_change_token_new_idx;
DROP INDEX auth.email_change_token_current_idx;
DROP INDEX auth.custom_oauth_providers_provider_type_idx;
DROP INDEX auth.custom_oauth_providers_identifier_idx;
DROP INDEX auth.custom_oauth_providers_enabled_idx;
DROP INDEX auth.custom_oauth_providers_created_at_idx;
DROP INDEX auth.confirmation_token_idx;
DROP INDEX auth.audit_logs_instance_id_idx;
ALTER TABLE ONLY supabase_migrations.schema_migrations DROP CONSTRAINT schema_migrations_pkey;
ALTER TABLE ONLY supabase_migrations.schema_migrations DROP CONSTRAINT schema_migrations_idempotency_key_key;
ALTER TABLE ONLY storage.vector_indexes DROP CONSTRAINT vector_indexes_pkey;
ALTER TABLE ONLY storage.s3_multipart_uploads DROP CONSTRAINT s3_multipart_uploads_pkey;
ALTER TABLE ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT s3_multipart_uploads_parts_pkey;
ALTER TABLE ONLY storage.objects DROP CONSTRAINT objects_pkey;
ALTER TABLE ONLY storage.migrations DROP CONSTRAINT migrations_pkey;
ALTER TABLE ONLY storage.migrations DROP CONSTRAINT migrations_name_key;
ALTER TABLE ONLY storage.buckets_vectors DROP CONSTRAINT buckets_vectors_pkey;
ALTER TABLE ONLY storage.buckets DROP CONSTRAINT buckets_pkey;
ALTER TABLE ONLY storage.buckets_analytics DROP CONSTRAINT buckets_analytics_pkey;
ALTER TABLE ONLY realtime.schema_migrations DROP CONSTRAINT schema_migrations_pkey;
ALTER TABLE ONLY realtime.subscription DROP CONSTRAINT pk_subscription;
ALTER TABLE ONLY realtime.messages DROP CONSTRAINT messages_pkey;
ALTER TABLE realtime.messages DROP CONSTRAINT messages_payload_exclusive;
ALTER TABLE ONLY public.tutors DROP CONSTRAINT tutors_pkey;
ALTER TABLE ONLY public.tutoring_requests DROP CONSTRAINT tutoring_requests_pkey;
ALTER TABLE ONLY public.tutor_subjects DROP CONSTRAINT tutor_subjects_pkey;
ALTER TABLE ONLY public.tutor_notes DROP CONSTRAINT tutor_notes_pkey;
ALTER TABLE ONLY public.support_cases DROP CONSTRAINT support_cases_pkey;
ALTER TABLE ONLY public.support_case_messages DROP CONSTRAINT support_case_messages_pkey;
ALTER TABLE ONLY public.subjects DROP CONSTRAINT subjects_pkey;
ALTER TABLE ONLY public.students DROP CONSTRAINT students_pkey;
ALTER TABLE ONLY public.student_subjects DROP CONSTRAINT student_subjects_pkey;
ALTER TABLE ONLY public.student_notes DROP CONSTRAINT student_notes_pkey;
ALTER TABLE ONLY public.staff_profiles DROP CONSTRAINT staff_profiles_pkey;
ALTER TABLE ONLY public.price_snapshots DROP CONSTRAINT price_snapshots_pkey;
ALTER TABLE ONLY public.price_books DROP CONSTRAINT price_books_pkey;
ALTER TABLE ONLY public.price_book_lines DROP CONSTRAINT price_book_lines_pkey;
ALTER TABLE ONLY public.policy_versions DROP CONSTRAINT policy_versions_pkey;
ALTER TABLE ONLY public.payment_records DROP CONSTRAINT payment_records_pkey;
ALTER TABLE ONLY public.integration_outbox DROP CONSTRAINT integration_outbox_pkey;
ALTER TABLE ONLY public.integration_inbox DROP CONSTRAINT integration_inbox_pkey;
ALTER TABLE ONLY public.identity_merge_requests DROP CONSTRAINT identity_merge_requests_pkey;
ALTER TABLE ONLY public.households DROP CONSTRAINT households_pkey;
ALTER TABLE ONLY public.household_notes DROP CONSTRAINT household_notes_pkey;
ALTER TABLE ONLY public.guardians DROP CONSTRAINT guardians_pkey;
ALTER TABLE ONLY public.guardian_notes DROP CONSTRAINT guardian_notes_pkey;
ALTER TABLE ONLY public.feature_flags DROP CONSTRAINT feature_flags_pkey;
ALTER TABLE ONLY public.course_offerings DROP CONSTRAINT course_offerings_pkey;
ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_pkey;
ALTER TABLE ONLY public.consent_evidence DROP CONSTRAINT consent_evidence_pkey;
ALTER TABLE ONLY public.change_requests DROP CONSTRAINT change_requests_pkey;
ALTER TABLE ONLY public.cancellation_policy_versions DROP CONSTRAINT cancellation_policy_versions_pkey;
ALTER TABLE ONLY public.bookings DROP CONSTRAINT bookings_pkey;
ALTER TABLE ONLY public.availability_slots DROP CONSTRAINT availability_slots_pkey;
ALTER TABLE ONLY public.audit_events DROP CONSTRAINT audit_events_pkey;
ALTER TABLE ONLY auth.webauthn_credentials DROP CONSTRAINT webauthn_credentials_pkey;
ALTER TABLE ONLY auth.webauthn_challenges DROP CONSTRAINT webauthn_challenges_pkey;
ALTER TABLE ONLY auth.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY auth.users DROP CONSTRAINT users_phone_key;
ALTER TABLE ONLY auth.sso_providers DROP CONSTRAINT sso_providers_pkey;
ALTER TABLE ONLY auth.sso_domains DROP CONSTRAINT sso_domains_pkey;
ALTER TABLE ONLY auth.sessions DROP CONSTRAINT sessions_pkey;
ALTER TABLE ONLY auth.schema_migrations DROP CONSTRAINT schema_migrations_pkey;
ALTER TABLE ONLY auth.saml_relay_states DROP CONSTRAINT saml_relay_states_pkey;
ALTER TABLE ONLY auth.saml_providers DROP CONSTRAINT saml_providers_pkey;
ALTER TABLE ONLY auth.saml_providers DROP CONSTRAINT saml_providers_entity_id_key;
ALTER TABLE ONLY auth.refresh_tokens DROP CONSTRAINT refresh_tokens_token_unique;
ALTER TABLE ONLY auth.refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
ALTER TABLE ONLY auth.one_time_tokens DROP CONSTRAINT one_time_tokens_pkey;
ALTER TABLE ONLY auth.oauth_consents DROP CONSTRAINT oauth_consents_user_client_unique;
ALTER TABLE ONLY auth.oauth_consents DROP CONSTRAINT oauth_consents_pkey;
ALTER TABLE ONLY auth.oauth_clients DROP CONSTRAINT oauth_clients_pkey;
ALTER TABLE ONLY auth.oauth_client_states DROP CONSTRAINT oauth_client_states_pkey;
ALTER TABLE ONLY auth.oauth_authorizations DROP CONSTRAINT oauth_authorizations_pkey;
ALTER TABLE ONLY auth.oauth_authorizations DROP CONSTRAINT oauth_authorizations_authorization_id_key;
ALTER TABLE ONLY auth.oauth_authorizations DROP CONSTRAINT oauth_authorizations_authorization_code_key;
ALTER TABLE ONLY auth.mfa_factors DROP CONSTRAINT mfa_factors_pkey;
ALTER TABLE ONLY auth.mfa_factors DROP CONSTRAINT mfa_factors_last_challenged_at_key;
ALTER TABLE ONLY auth.mfa_challenges DROP CONSTRAINT mfa_challenges_pkey;
ALTER TABLE ONLY auth.mfa_amr_claims DROP CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey;
ALTER TABLE ONLY auth.instances DROP CONSTRAINT instances_pkey;
ALTER TABLE ONLY auth.identities DROP CONSTRAINT identities_provider_id_provider_unique;
ALTER TABLE ONLY auth.identities DROP CONSTRAINT identities_pkey;
ALTER TABLE ONLY auth.flow_state DROP CONSTRAINT flow_state_pkey;
ALTER TABLE ONLY auth.custom_oauth_providers DROP CONSTRAINT custom_oauth_providers_pkey;
ALTER TABLE ONLY auth.custom_oauth_providers DROP CONSTRAINT custom_oauth_providers_identifier_key;
ALTER TABLE ONLY auth.audit_log_entries DROP CONSTRAINT audit_log_entries_pkey;
ALTER TABLE ONLY auth.mfa_amr_claims DROP CONSTRAINT amr_id_pk;
ALTER TABLE auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
DROP TABLE supabase_migrations.schema_migrations;
DROP TABLE storage.vector_indexes;
DROP TABLE storage.s3_multipart_uploads_parts;
DROP TABLE storage.s3_multipart_uploads;
DROP TABLE storage.objects;
DROP TABLE storage.migrations;
DROP TABLE storage.buckets_vectors;
DROP TABLE storage.buckets_analytics;
DROP TABLE storage.buckets;
DROP TABLE realtime.subscription;
DROP TABLE realtime.schema_migrations;
DROP TABLE realtime.messages;
DROP TABLE public.tutors;
DROP TABLE public.tutoring_requests;
DROP TABLE public.tutor_subjects;
DROP TABLE public.tutor_notes;
DROP TABLE public.support_cases;
DROP TABLE public.support_case_messages;
DROP TABLE public.subjects;
DROP TABLE public.students;
DROP TABLE public.student_subjects;
DROP TABLE public.student_notes;
DROP TABLE public.staff_profiles;
DROP TABLE public.price_snapshots;
DROP TABLE public.price_books;
DROP TABLE public.price_book_lines;
DROP TABLE public.policy_versions;
DROP TABLE public.payment_records;
DROP TABLE public.integration_outbox;
DROP TABLE public.integration_inbox;
DROP TABLE public.identity_merge_requests;
DROP TABLE public.households;
DROP TABLE public.household_notes;
DROP TABLE public.guardians;
DROP TABLE public.guardian_notes;
DROP TABLE public.feature_flags;
DROP TABLE public.course_offerings;
DROP TABLE public.course_enrollments;
DROP TABLE public.consent_evidence;
DROP TABLE public.change_requests;
DROP TABLE public.cancellation_policy_versions;
DROP TABLE public.bookings;
DROP TABLE public.availability_slots;
DROP TABLE public.audit_events;
DROP TABLE auth.webauthn_credentials;
DROP TABLE auth.webauthn_challenges;
DROP TABLE auth.users;
DROP TABLE auth.sso_providers;
DROP TABLE auth.sso_domains;
DROP TABLE auth.sessions;
DROP TABLE auth.schema_migrations;
DROP TABLE auth.saml_relay_states;
DROP TABLE auth.saml_providers;
DROP SEQUENCE auth.refresh_tokens_id_seq;
DROP TABLE auth.refresh_tokens;
DROP TABLE auth.one_time_tokens;
DROP TABLE auth.oauth_consents;
DROP TABLE auth.oauth_clients;
DROP TABLE auth.oauth_client_states;
DROP TABLE auth.oauth_authorizations;
DROP TABLE auth.mfa_factors;
DROP TABLE auth.mfa_challenges;
DROP TABLE auth.mfa_amr_claims;
DROP TABLE auth.instances;
DROP TABLE auth.identities;
DROP TABLE auth.flow_state;
DROP TABLE auth.custom_oauth_providers;
DROP TABLE auth.audit_log_entries;
DROP FUNCTION storage.update_updated_at_column();
DROP FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text);
DROP FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text);
DROP FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION storage.protect_delete();
DROP FUNCTION storage.operation();
DROP FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text);
DROP FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text);
DROP FUNCTION storage.get_size_by_bucket();
DROP FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text);
DROP FUNCTION storage.foldername(name text);
DROP FUNCTION storage.filename(name text);
DROP FUNCTION storage.extension(name text);
DROP FUNCTION storage.enforce_bucket_name_length();
DROP FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb);
DROP FUNCTION storage.allow_only_operation(expected_operation text);
DROP FUNCTION storage.allow_any_operation(expected_operations text[]);
DROP FUNCTION realtime.wal2json_escape_identifier(name text);
DROP FUNCTION realtime.topic();
DROP FUNCTION realtime.to_regrole(role_name text);
DROP FUNCTION realtime.subscription_check_filters();
DROP FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean);
DROP FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean);
DROP FUNCTION realtime.quote_wal2json(entity regclass);
DROP FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer);
DROP FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]);
DROP FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean);
DROP FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text);
DROP FUNCTION realtime."cast"(val text, type_ regtype);
DROP FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]);
DROP FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text);
DROP FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer);
DROP FUNCTION pgbouncer.get_auth(p_usename text);
DROP FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb);
DROP FUNCTION extensions.set_graphql_placeholder();
DROP FUNCTION extensions.pgrst_drop_watch();
DROP FUNCTION extensions.pgrst_ddl_watch();
DROP FUNCTION extensions.grant_pg_net_access();
DROP FUNCTION extensions.grant_pg_graphql_access();
DROP FUNCTION extensions.grant_pg_cron_access();
DROP FUNCTION auth.uid();
DROP FUNCTION auth.role();
DROP FUNCTION auth.jwt();
DROP FUNCTION auth.email();
DROP TYPE storage.buckettype;
DROP TYPE realtime.wal_rls;
DROP TYPE realtime.wal_column;
DROP TYPE realtime.user_defined_filter;
DROP TYPE realtime.equality_op;
DROP TYPE realtime.action;
DROP TYPE public.tutoring_request_status;
DROP TYPE public.support_message_author;
DROP TYPE public.support_case_status;
DROP TYPE public.support_case_priority;
DROP TYPE public.student_lifecycle;
DROP TYPE public.staff_role;
DROP TYPE public.payment_status;
DROP TYPE public.outbox_status;
DROP TYPE public.household_status;
DROP TYPE public.guardian_status;
DROP TYPE public.guardian_relationship_role;
DROP TYPE public.enrollment_status;
DROP TYPE public.change_request_status;
DROP TYPE public.booking_status;
DROP TYPE auth.one_time_token_type;
DROP TYPE auth.oauth_response_type;
DROP TYPE auth.oauth_registration_type;
DROP TYPE auth.oauth_client_type;
DROP TYPE auth.oauth_authorization_status;
DROP TYPE auth.factor_type;
DROP TYPE auth.factor_status;
DROP TYPE auth.code_challenge_method;
DROP TYPE auth.aal_level;
DROP EXTENSION "uuid-ossp";
DROP EXTENSION supabase_vault;
DROP EXTENSION pgcrypto;
DROP EXTENSION pg_stat_statements;
DROP SCHEMA vault;
DROP SCHEMA supabase_migrations;
DROP SCHEMA storage;
DROP SCHEMA realtime;
DROP SCHEMA pgbouncer;
DROP SCHEMA graphql_public;
DROP SCHEMA graphql;
DROP SCHEMA extensions;
DROP SCHEMA auth;
--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'draft',
    'held',
    'pending_payment',
    'pending_staff_review',
    'confirmed',
    'cancelled',
    'failed'
);


--
-- Name: change_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.change_request_status AS ENUM (
    'submitted',
    'under_review',
    'approved',
    'declined',
    'applied'
);


--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollment_status AS ENUM (
    'draft',
    'submitted',
    'waitlisted',
    'confirmed',
    'cancelled'
);


--
-- Name: guardian_relationship_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.guardian_relationship_role AS ENUM (
    'parent_1',
    'parent_2'
);


--
-- Name: guardian_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.guardian_status AS ENUM (
    'active',
    'archived'
);


--
-- Name: household_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.household_status AS ENUM (
    'active',
    'pending',
    'inactive',
    'archived'
);


--
-- Name: outbox_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.outbox_status AS ENUM (
    'pending',
    'processing',
    'sent',
    'failed',
    'dead'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'unpaid',
    'pending',
    'paid',
    'partial',
    'refunded',
    'failed',
    'waived'
);


--
-- Name: staff_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.staff_role AS ENUM (
    'admin',
    'scheduler',
    'finance',
    'support'
);


--
-- Name: student_lifecycle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.student_lifecycle AS ENUM (
    'prospect',
    'active',
    'paused',
    'completed',
    'archived'
);


--
-- Name: support_case_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_case_priority AS ENUM (
    'normal',
    'time_sensitive'
);


--
-- Name: support_case_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_case_status AS ENUM (
    'submitted',
    'under_review',
    'waiting_on_family',
    'resolved'
);


--
-- Name: support_message_author; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.support_message_author AS ENUM (
    'family',
    'staff',
    'system'
);


--
-- Name: tutoring_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tutoring_request_status AS ENUM (
    'draft',
    'submitted',
    'pending_staff_review',
    'held',
    'confirmed',
    'cancelled',
    'failed'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
begin
    if not exists (
        select 1
        from pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_type text NOT NULL,
    actor_id text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    household_id uuid,
    correlation_id text,
    reason text,
    before_state jsonb,
    after_state jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time_local character varying(8) NOT NULL,
    end_time_local character varying(8) NOT NULL,
    capacity_seats integer DEFAULT 1 NOT NULL,
    held_seats integer DEFAULT 0 NOT NULL,
    booked_seats integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    label text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_window_id character varying(64)
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutoring_request_id uuid NOT NULL,
    household_id uuid NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    tutor_id uuid,
    slot_id uuid,
    status public.booking_status DEFAULT 'pending_staff_review'::public.booking_status NOT NULL,
    seats_claimed integer DEFAULT 1 NOT NULL,
    price_snapshot_id uuid,
    policy_version_id uuid,
    confirmed_by_staff_id uuid,
    confirmed_at timestamp with time zone,
    hold_expires_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attendance_status text,
    attendance_notes text,
    attendance_recorded_at timestamp with time zone,
    attendance_recorded_by_staff_id uuid
);


--
-- Name: cancellation_policy_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellation_policy_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    kind text DEFAULT 'cancellation'::text NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    rules jsonb NOT NULL,
    created_by_staff_id uuid,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    student_id uuid NOT NULL,
    requested_by_guardian_id uuid,
    related_entity_type text NOT NULL,
    related_entity_id uuid NOT NULL,
    change_type text NOT NULL,
    reason text NOT NULL,
    requested_outcome text NOT NULL,
    preferred_alternatives text,
    policy_recommendation text NOT NULL,
    status public.change_request_status DEFAULT 'submitted'::public.change_request_status NOT NULL,
    staff_notes text,
    resolved_by_staff_id uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cancellation_policy_version_id uuid
);


--
-- Name: consent_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    guardian_id uuid,
    policy_version_id uuid NOT NULL,
    related_entity_type text NOT NULL,
    related_entity_id uuid NOT NULL,
    acknowledgement_text text NOT NULL,
    signed_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_offering_id uuid NOT NULL,
    household_id uuid NOT NULL,
    student_id uuid NOT NULL,
    requested_by_guardian_id uuid,
    status public.enrollment_status DEFAULT 'submitted'::public.enrollment_status NOT NULL,
    requested_slot_preference text,
    price_snapshot_id uuid,
    policy_version_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referral_source text
);


--
-- Name: course_offerings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_offerings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name text NOT NULL,
    description text,
    term_label text,
    schedule_summary text,
    capacity integer DEFAULT 20 NOT NULL,
    enrolled_count integer DEFAULT 0 NOT NULL,
    tuition_cents integer DEFAULT 0 NOT NULL,
    registration_fee_cents integer DEFAULT 0 NOT NULL,
    materials_fee_cents integer DEFAULT 0 NOT NULL,
    policy_version_id uuid,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    instructor_name text
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(64) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guardian_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guardian_id uuid NOT NULL,
    author_staff_id uuid,
    author_display_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editor_staff_id uuid,
    editor_display_name text,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by_staff_id uuid
);


--
-- Name: guardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid,
    clerk_user_id text,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone character varying(40),
    is_billing_owner boolean DEFAULT false NOT NULL,
    can_manage_students boolean DEFAULT true NOT NULL,
    can_request_services boolean DEFAULT true NOT NULL,
    invite_token text,
    invite_accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    relationship_role public.guardian_relationship_role,
    other_information text,
    address_line1 text,
    address_line2 text,
    city text,
    state character varying(32),
    postal_code character varying(32),
    country text DEFAULT 'United States'::text NOT NULL,
    status public.guardian_status DEFAULT 'active'::public.guardian_status NOT NULL,
    zoho_crm_id text,
    zoho_crm_url text
);


--
-- Name: household_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.household_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    author_staff_id uuid,
    author_display_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editor_staff_id uuid,
    editor_display_name text,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by_staff_id uuid
);


--
-- Name: households; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.households (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_name text NOT NULL,
    status public.household_status DEFAULT 'pending'::public.household_status NOT NULL,
    billing_owner_guardian_id uuid,
    primary_phone character varying(40),
    address_line1 text,
    address_line2 text,
    city text,
    state character varying(40),
    postal_code character varying(20),
    timezone text DEFAULT 'America/New_York'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stripe_customer_id text,
    stripe_default_payment_method_id text,
    card_brand text,
    card_last4 character varying(4),
    payment_method_consent_at timestamp with time zone,
    payment_method_consent_version text,
    display_name_manual boolean DEFAULT false NOT NULL,
    country text DEFAULT 'United States'::text NOT NULL,
    zoho_crm_id text,
    zoho_crm_url text,
    card_on_file boolean DEFAULT false NOT NULL,
    auto_charge boolean DEFAULT false NOT NULL
);


--
-- Name: identity_merge_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_merge_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_household_id uuid NOT NULL,
    target_household_id uuid NOT NULL,
    match_on text,
    status text DEFAULT 'queued'::text NOT NULL,
    notes text,
    created_by_staff_id uuid,
    resolved_by_staff_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone
);


--
-- Name: integration_inbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_inbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(32) NOT NULL,
    external_event_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: integration_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(32) NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    idempotency_key text NOT NULL,
    status public.outbox_status DEFAULT 'pending'::public.outbox_status NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    correlation_id text,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    related_entity_type text NOT NULL,
    related_entity_id uuid NOT NULL,
    status public.payment_status DEFAULT 'unpaid'::public.payment_status NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    method_label text,
    recorded_by_staff_id uuid,
    notes text,
    stripe_payment_intent_id text,
    stripe_customer_id text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: policy_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    title text NOT NULL,
    version_label text NOT NULL,
    body_summary text,
    document_url text,
    effective_from timestamp with time zone NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_book_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_book_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    price_book_id uuid NOT NULL,
    program text NOT NULL,
    rate_tier text,
    package_code text,
    plan_code text,
    amount_cents integer DEFAULT 0 NOT NULL,
    registration_fee_cents integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    reason text,
    created_by_staff_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    amount_cents integer NOT NULL,
    plan_label text,
    fee_breakdown jsonb,
    source_catalog_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    price_book_id uuid
);


--
-- Name: staff_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clerk_user_id text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role public.staff_role DEFAULT 'support'::public.staff_role NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    author_staff_id uuid,
    author_display_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editor_staff_id uuid,
    editor_display_name text,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by_staff_id uuid
);


--
-- Name: student_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid,
    display_name text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    gender text,
    school_name text,
    graduation_year integer,
    grade_label text,
    lifecycle public.student_lifecycle DEFAULT 'prospect'::public.student_lifecycle NOT NULL,
    cell_phone character varying(40),
    email text,
    birthdate text,
    support_notes_restricted text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    learning_needs text,
    availability_notes text,
    emergency_contact text,
    change_request_status text,
    pending_intake_note text,
    service_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    description text,
    zoho_deal_id text,
    zoho_deal_url text,
    academic_year text,
    preferred_schedule text,
    hours_rate_package text,
    advanced_hours_rate_package text,
    payment_plan text,
    deposit_cents integer,
    address_line1 text,
    address_line2 text,
    city text,
    state character varying(32),
    postal_code character varying(32),
    country text DEFAULT 'United States'::text NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name text NOT NULL,
    category text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_case_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_case_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    body text NOT NULL,
    author_role public.support_message_author NOT NULL,
    author_guardian_id uuid,
    author_staff_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    created_by_guardian_id uuid NOT NULL,
    topic text NOT NULL,
    priority public.support_case_priority DEFAULT 'normal'::public.support_case_priority NOT NULL,
    related_label text,
    student_id uuid,
    status public.support_case_status DEFAULT 'submitted'::public.support_case_status NOT NULL,
    assignee_staff_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tutor_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid NOT NULL,
    author_staff_id uuid,
    author_display_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    editor_staff_id uuid,
    editor_display_name text,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by_staff_id uuid
);


--
-- Name: tutor_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    priority integer DEFAULT 100 NOT NULL
);


--
-- Name: tutoring_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutoring_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    household_id uuid NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    requested_by_guardian_id uuid,
    status public.tutoring_request_status DEFAULT 'draft'::public.tutoring_request_status NOT NULL,
    preferred_slot_id uuid,
    schedule_notes text,
    subject_notes text,
    referral_source text,
    package_label text,
    policy_version_id uuid,
    agreement_accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    form_id text,
    schedule_window_id character varying(64),
    payment_plan_id character varying(64),
    payload jsonb
);


--
-- Name: tutors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_name text NOT NULL,
    email text,
    phone character varying(40),
    active boolean DEFAULT true NOT NULL,
    max_seats_per_slot integer DEFAULT 1 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    address_line1 text,
    address_line2 text,
    city text,
    state character varying(32),
    postal_code character varying(32),
    country text DEFAULT 'United States'::text NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    CONSTRAINT buckets_versioning_dark_check CHECK ((versioning_status = 'DISABLED'::text)),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_events (id, actor_type, actor_id, action, entity_type, entity_id, household_id, correlation_id, reason, before_state, after_state, created_at) FROM stdin;
98c544a2-41ca-4fde-b12a-915a2e256be5	guardian	29abda07-8587-42eb-9e96-e59af0aee63b	household.created	household	182ca09a-2300-469d-860a-15e2842f405e	182ca09a-2300-469d-860a-15e2842f405e	\N	\N	\N	\N	2026-08-01 16:46:25.256036+00
729beea1-b587-480c-85f5-9886db32b38f	guardian	29abda07-8587-42eb-9e96-e59af0aee63b	student.created	student	68bed38c-6479-4b3d-abb3-b6bc1aece5a5	182ca09a-2300-469d-860a-15e2842f405e	\N	\N	\N	\N	2026-08-01 16:59:50.934221+00
\.


--
-- Data for Name: availability_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.availability_slots (id, tutor_id, day_of_week, start_time_local, end_time_local, capacity_seats, held_seats, booked_seats, active, label, created_at, updated_at, schedule_window_id) FROM stdin;
09b18828-6531-4573-a385-d8a72cd1d742	6129aee2-8295-4a02-90c0-35c1ba221fbb	3	17:15:00	19:15:00	1	0	0	t	Wednesday 5:15-7:15pm	2026-08-01 16:35:49.870621+00	2026-08-01 16:35:49.870621+00	wed_1715_1915
bbf68d89-0b80-4ff8-9539-164cd41fbfdd	6129aee2-8295-4a02-90c0-35c1ba221fbb	2	17:15:00	19:15:00	2	0	0	t	Tuesday 5:15-7:15pm	2026-08-01 16:35:49.870621+00	2026-08-01 16:35:49.870621+00	tue_1715_1915
becc0e19-0334-48ad-9820-85ed5fb7d290	482851b1-c7de-4b0d-911a-269c5416cc0a	2	15:15:00	17:15:00	1	0	0	t	Tuesday 3:15-5:15pm	2026-08-10 15:26:02.812491+00	2026-08-10 15:26:02.812491+00	tue_1515_1715
3018a09b-eef6-40cc-82c4-53f94e857bcf	482851b1-c7de-4b0d-911a-269c5416cc0a	3	17:00:00	19:00:00	2	0	0	t	Wednesday 5-7 pm	2026-08-10 15:26:02.812491+00	2026-08-10 15:26:02.812491+00	wed_1700_1900
3eb1d9fd-9eb9-456c-bb2d-f5cfe7f1a303	019850a8-bc88-453c-ba26-cf056b4eb200	4	15:30:00	17:30:00	2	0	0	t	Thursday 3:30-5:30pm	2026-08-10 15:26:02.812491+00	2026-08-10 15:26:02.812491+00	thu_1530_1730
7ca816f4-ccc2-4bb8-a3a2-31e03c0c6c9d	019850a8-bc88-453c-ba26-cf056b4eb200	1	11:00:00	13:00:00	2	0	0	t	Monday 11 am -1 pm	2026-08-10 15:26:02.812491+00	2026-08-10 15:26:02.812491+00	mon_1100_1300
2d5099ba-642d-44c7-abe8-369ff12fadc9	6129aee2-8295-4a02-90c0-35c1ba221fbb	0	15:00:00	17:00:00	2	0	2	t	Sunday 3:00-5:00pm	2026-08-01 16:35:49.870621+00	2026-08-19 20:26:30.369+00	sun_1500_1700
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, tutoring_request_id, household_id, student_id, subject_id, tutor_id, slot_id, status, seats_claimed, price_snapshot_id, policy_version_id, confirmed_by_staff_id, confirmed_at, hold_expires_at, cancellation_reason, created_at, updated_at, attendance_status, attendance_notes, attendance_recorded_at, attendance_recorded_by_staff_id) FROM stdin;
2bd7dca6-e301-4d2e-8a72-c37a57bd125c	c46dce5c-712d-47b8-9642-834384421f19	e6a165ad-fb25-4d72-85ae-02108cd65779	4057e0fe-cc30-4500-875e-75b7c0b1ace5	3c4016d9-8a40-4f01-805e-b39f3c645f0f	6129aee2-8295-4a02-90c0-35c1ba221fbb	2d5099ba-642d-44c7-abe8-369ff12fadc9	confirmed	1	\N	\N	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	2026-08-19 20:26:23.339+00	\N	\N	2026-08-19 20:26:23.933229+00	2026-08-19 20:26:23.339+00	\N	\N	\N	\N
524ad6a6-d2e9-4d80-b76c-827abe72464b	383246f4-e2aa-48ee-b173-9f9e9a4a803e	1bb87b0b-a031-4080-b6e0-286be066e257	cb9c3b77-7de3-4799-af67-3b16834553a1	3c4016d9-8a40-4f01-805e-b39f3c645f0f	6129aee2-8295-4a02-90c0-35c1ba221fbb	2d5099ba-642d-44c7-abe8-369ff12fadc9	confirmed	1	\N	\N	\N	\N	\N	\N	2026-08-19 20:26:31.418495+00	2026-08-19 20:26:30.369+00	\N	\N	\N	\N
\.


--
-- Data for Name: cancellation_policy_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancellation_policy_versions (id, code, kind, effective_from, status, rules, created_by_staff_id, reason, created_at, updated_at) FROM stdin;
1e379d74-0fae-43cb-ad3f-580ad1e1c0bc	PT-CAN-2026.3	cancellation	2026-08-01 04:00:00+00	active	{"noticeHours": 24, "eligibleReasons": ["Illness", "School conflict", "Emergency", "Tutor cancelled"], "noShowTreatment": "No credit by default · Staff exception allowed", "bankedExpiryDays": 90, "bankedExpiryMode": "days", "partialCreditRule": "Prorate only with authorized exception", "tutorCancelTreatment": "Banked replacement or refund review", "defaultEligibleOutcome": "banked_credit"}	\N	Seeded from current change-request recommendation copy	2026-08-12 01:31:34.245802+00	2026-08-12 01:31:34.245802+00
\.


--
-- Data for Name: change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.change_requests (id, household_id, student_id, requested_by_guardian_id, related_entity_type, related_entity_id, change_type, reason, requested_outcome, preferred_alternatives, policy_recommendation, status, staff_notes, resolved_by_staff_id, resolved_at, created_at, updated_at, cancellation_policy_version_id) FROM stdin;
\.


--
-- Data for Name: consent_evidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consent_evidence (id, household_id, guardian_id, policy_version_id, related_entity_type, related_entity_id, acknowledgement_text, signed_at, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_enrollments (id, course_offering_id, household_id, student_id, requested_by_guardian_id, status, requested_slot_preference, price_snapshot_id, policy_version_id, notes, created_at, updated_at, referral_source) FROM stdin;
4a93c538-9a16-4029-948a-ed9acbecf740	1015a94c-c8d9-430b-8e17-88622ed5d734	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	1f6e573c-5d76-4550-a18f-f18f6f95bbfc	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	submitted	mon_0622,mon_0629,mon_0706	\N	\N	{"formId":"summer_master_class","paymentPlanId":"monthly","scheduleLabel":"June 22; June 29; July 6"}	2026-08-11 09:36:35.4128+00	2026-08-11 09:36:33.323+00	\N
\.


--
-- Data for Name: course_offerings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_offerings (id, code, name, description, term_label, schedule_summary, capacity, enrolled_count, tuition_cents, registration_fee_cents, materials_fee_cents, policy_version_id, active, created_at, updated_at, instructor_name) FROM stdin;
1a103657-b8c9-4bc1-b132-7df3865a1d60	EXPRESS-2026	The Express	6-month express program	2026-27	Schedule pending client confirmation	16	0	240000	10000	5000	aa33dfc0-d102-4d32-8fee-b7fc28b71af6	t	2026-08-01 16:35:51.436367+00	2026-08-01 16:35:51.436367+00	\N
1015a94c-c8d9-430b-8e17-88622ed5d734	SUMMER-MASTER-2026	Summer Master Class	Summer SAT/ACT master class	Summer 2026	Monday morning / Wednesday evening sequence	20	1	180000	10000	5000	aa33dfc0-d102-4d32-8fee-b7fc28b71af6	t	2026-08-01 16:35:52.214119+00	2026-08-11 09:36:33.323+00	\N
5dfba15a-223c-429c-850d-20dc855ce8b7	FIRST-CLASS-2026	SAT/ACT First Class	9-month first-class program	2026-27	Sunday 5:15–7:15 or 7:15–9:15	18	0	360000	15000	7500	aa33dfc0-d102-4d32-8fee-b7fc28b71af6	f	2026-08-01 16:35:50.648577+00	2026-08-12 18:00:36.466+00	\N
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feature_flags (id, key, enabled, description, updated_at) FROM stdin;
48d8ed6f-f7eb-4dee-b9ba-183e3be13c36	resend	t	Transactional email via Resend adapter	2026-08-01 16:35:38.203213+00
e1fa5b95-1469-4983-b70e-0d16361e593f	stripe	f	Stripe live payments (deferred)	2026-08-01 16:35:39.000672+00
d23da267-0b86-4269-8ac8-8bbf2ee383f6	acuity	f	Acuity scheduling sync (deferred)	2026-08-01 16:35:39.788289+00
71021ea7-b5ac-4932-ba51-59c578b168a6	qbo	f	QuickBooks Online (deferred)	2026-08-01 16:35:40.585836+00
df688a31-30ae-4a45-98e0-76a80a736316	zoho	f	Zoho CRM sync (deferred)	2026-08-01 16:35:41.393112+00
\.


--
-- Data for Name: guardian_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guardian_notes (id, guardian_id, author_staff_id, author_display_name, body, created_at, editor_staff_id, editor_display_name, updated_at, deleted_at, deleted_by_staff_id) FROM stdin;
c3e59bc7-354a-4dd6-9273-c125b58d13f4	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	ggxhfjfgncwdxd	2026-08-16 10:37:16.460823+00	\N	\N	\N	\N	\N
2ff48563-72ea-4e9d-b65b-b480681aa334	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	gxgdxhfgjgxeabt sgqz(zqge('(zzg(qz wese(bzqzerqe rvqerqbzrqzbr SVRWSBERTSEBTWSEBTZ EBTWSEBTZETBZSBTWXTBE SBERWSTBSERTE53634N6B WBZ55QZYWA25BTBDXTB SEBWZ3TSEBZ3	2026-08-16 10:37:59.182943+00	\N	\N	\N	2026-08-16 11:12:11.536+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c
2df62ea9-0794-404f-a523-2116b77e3ac8	e1a0ea9c-00eb-4a72-830d-7304d831a2fc	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	jhqsgfjqkjfhkcl qlrvqklk jlkjlkrjqlk lqkrjk qlrmqmrqlkml qrlk rjke rljz	2026-08-16 12:55:29.160525+00	\N	\N	\N	\N	\N
\.


--
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guardians (id, household_id, clerk_user_id, email, first_name, last_name, phone, is_billing_owner, can_manage_students, can_request_services, invite_token, invite_accepted_at, created_at, updated_at, relationship_role, other_information, address_line1, address_line2, city, state, postal_code, country, status, zoho_crm_id, zoho_crm_url) FROM stdin;
7ac34799-f1a1-4f4d-a93e-837295a9ca6a	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	user_3HhC8BSDjkLnNjtZnalyg3p5I6o	rwhandenon.rw@gmail.com	Techma	Techma	\N	t	t	t	\N	\N	2026-08-09 21:42:51.034414+00	2026-08-15 19:20:05.668+00	\N	\N	\N	\N	\N	\N	\N	United States	active	\N	\N
e1a0ea9c-00eb-4a72-830d-7304d831a2fc	182ca09a-2300-469d-860a-15e2842f405e	user_3HiuIkksKDVasSZNp6IdIbRafDe	rtccotlagune@gmail.com	Parent	Guardian	+2290123466432	t	t	t	\N	\N	2026-08-10 11:59:11.754648+00	2026-08-17 12:39:29.948+00	parent_1	\N	\N	\N	\N	\N	\N	United States	active	\N	\N
94738f43-bbf9-4e0f-b12e-f84a680e6728	2fc6b4c0-d037-4e12-82a8-190a94f2fbfa	\N	test@test.ca	Test	Test	+229014524354546	t	t	t	\N	\N	2026-08-17 12:23:32.117848+00	2026-08-18 21:12:42.526+00	parent_1	\N	\N	\N	\N	\N	\N	United States	active	\N	\N
8aff4bba-b7d6-49a0-81a5-955df7343b08	427652e9-a620-4e61-a2b1-f68715de41e0	\N	ay-parent-b-1787161088402@example.com	Pat	Martin	7035550100	t	t	t	f40936da6fb75199a5505facda7e91b58b3f7b61f7490dcf	\N	2026-08-19 17:38:12.854579+00	2026-08-19 17:38:12.597+00	parent_1	\N	1 Main St	\N	Burke	VA	22015	United States	active	\N	\N
58ecc2ff-3a89-4a6e-a249-9d4a706fcbae	1bb87b0b-a031-4080-b6e0-286be066e257	\N	ay-p1-a-1787171166269@example.com	Pat	Martin	2025559755	t	t	t	625825167c55c0a2a8b2781c79105ddf8045a42cd59af705	\N	2026-08-19 20:26:11.535736+00	2026-08-19 20:26:11.159+00	parent_1	\N	1 Main St	\N	Burke	VA	22015	United States	active	\N	\N
477b4c36-d5a6-4ef4-8ca2-1fd2dd005f33	e6a165ad-fb25-4d72-85ae-02108cd65779	\N	ay-p1-b-1787171166269@example.com	Pat	Martin	2025559768	t	t	t	c451aa8f0b6244059b52a4aad1ce675b14de5ecc95345274	\N	2026-08-19 20:26:17.893838+00	2026-08-19 20:26:17.505+00	parent_1	\N	1 Main St	\N	Burke	VA	22015	United States	active	\N	\N
\.


--
-- Data for Name: household_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.household_notes (id, household_id, author_staff_id, author_display_name, body, created_at, editor_staff_id, editor_display_name, updated_at, deleted_at, deleted_by_staff_id) FROM stdin;
97786805-4e62-4190-954d-02274c935671	2fc6b4c0-d037-4e12-82a8-190a94f2fbfa	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	Staff	2026-08-14 16:11:17.66087+00	\N	\N	\N	\N	\N
6aedc20b-6ae1-493d-9a94-1e02f8665827	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	\N	Imported note	This is a Test vwdxv	2026-08-12 17:12:11.545+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:05:51.929+00	\N	\N
6828f21b-1113-4fbd-a4b5-8b369a50dcc9	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	cbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-14 15:52:55.305329+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:06:18.982+00	\N	\N
f570ed8d-33e8-4cd7-8740-7c28ac41a905	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	dsgdshfs\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-15 21:58:47.277961+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:27:09.753+00	\N	\N
84f6b8ee-4404-4788-91ce-45bc69dc2c65	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	dfqsgqdsfzrAZgdfd\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-15 21:59:03.809832+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:27:23.967+00	\N	\N
2b384dd7-440d-4446-9192-2b07397516f6	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	ghdfgsdgdfg\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-15 21:58:53.293935+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:27:30.585+00	\N	\N
d7beed27-e962-49e8-b8a6-82320d2527f0	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	Visible\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTetcbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-14 16:33:10.195547+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:27:40.485+00	\N	\N
3a4f5bd0-9ed4-4731-baf3-3e2908dcbdb3	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	Another test Test &esvwdw\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTetcbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\ncbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet\nvvcbxcbx dws rqzrd ydrtys swset esrtgxxdg dwtdr dxg etx gdrtdrd drt ter te f gr ter et ert esrt ertqt syr yrth fdgw r'(-z 'egdr( yrTet	2026-08-14 16:57:04.078097+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	Test Techma	2026-08-15 22:27:50.678+00	\N	\N
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.households (id, display_name, status, billing_owner_guardian_id, primary_phone, address_line1, address_line2, city, state, postal_code, timezone, notes, created_at, updated_at, stripe_customer_id, stripe_default_payment_method_id, card_brand, card_last4, payment_method_consent_at, payment_method_consent_version, display_name_manual, country, zoho_crm_id, zoho_crm_url, card_on_file, auto_charge) FROM stdin;
f37582bc-e1ed-4d44-99f8-8c7fa8e48835	Guardian Family	active	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	+2290140547923	Avotrou	\N	CTN	Littoral	229	America/New_York	This is a Test	2026-08-09 21:42:50.620844+00	2026-08-16 00:07:13.594+00	cus_V3Gt1woXhhkS2s	pm_1U3AztLAw07qjPyx4SxFIGF3	\N	\N	2026-08-11 08:45:10.055+00	v1-book-tutoring-2026	t	United States	Test	https://www.google.com/	t	f
182ca09a-2300-469d-860a-15e2842f405e	Ross Family	active	e1a0ea9c-00eb-4a72-830d-7304d831a2fc	+2290140000000	\N	\N	\N	\N	\N	America/New_York	\N	2026-08-01 16:46:23.93678+00	2026-08-16 12:56:26.128+00	\N	\N	\N	\N	\N	\N	t	United States	\N	\N	f	f
2fc6b4c0-d037-4e12-82a8-190a94f2fbfa	Test - test@test.ca	pending	94738f43-bbf9-4e0f-b12e-f84a680e6728	\N	New Port Road	\N	Eastport	ME	04631	America/New_York	\N	2026-08-10 11:59:11.354561+00	2026-08-18 21:12:41.006+00	\N	\N	\N	\N	\N	\N	t	United States	\N	\N	f	f
427652e9-a620-4e61-a2b1-f68715de41e0	Martin1787161088402 - ay-bill-b-1787161088402@example.com	pending	8aff4bba-b7d6-49a0-81a5-955df7343b08	7035550100	9 Billing Rd	\N	Burke	VA	22015	America/New_York	\N	2026-08-19 17:38:12.854579+00	2026-08-19 17:38:12.597+00	\N	\N	\N	\N	\N	\N	f	United States	\N	\N	f	f
1bb87b0b-a031-4080-b6e0-286be066e257	Phase1a1787171166269 - ay-bill-a-1787171166269@example.com	pending	58ecc2ff-3a89-4a6e-a249-9d4a706fcbae	2025559755	9 Billing Rd	\N	Burke	VA	22015	America/New_York	\N	2026-08-19 20:26:11.535736+00	2026-08-19 20:26:11.159+00	\N	\N	\N	\N	\N	\N	f	United States	\N	\N	f	f
e6a165ad-fb25-4d72-85ae-02108cd65779	Phase1b1787171166269 - ay-bill-b-1787171166269@example.com	pending	477b4c36-d5a6-4ef4-8ca2-1fd2dd005f33	2025559768	9 Billing Rd	\N	Burke	VA	22015	America/New_York	\N	2026-08-19 20:26:17.893838+00	2026-08-19 20:26:17.505+00	\N	\N	\N	\N	\N	\N	f	United States	\N	\N	f	f
\.


--
-- Data for Name: identity_merge_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.identity_merge_requests (id, source_household_id, target_household_id, match_on, status, notes, created_by_staff_id, resolved_by_staff_id, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: integration_inbox; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_inbox (id, provider, external_event_id, event_type, payload, processed, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: integration_outbox; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_outbox (id, provider, event_type, payload, idempotency_key, status, attempts, last_error, correlation_id, available_at, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: payment_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_records (id, household_id, related_entity_type, related_entity_id, status, amount_cents, currency, method_label, recorded_by_staff_id, notes, stripe_payment_intent_id, stripe_customer_id, paid_at, created_at, updated_at) FROM stdin;
676b6db1-9f79-4bb5-ba40-0807bc128340	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	course_enrollment	4a93c538-9a16-4029-948a-ed9acbecf740	pending	0	USD	card ···· ****	\N	Payment plan: monthly	\N	cus_V3Gt1woXhhkS2s	\N	2026-08-11 09:36:36.574438+00	2026-08-11 09:36:33.323+00
\.


--
-- Data for Name: policy_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.policy_versions (id, code, title, version_label, body_summary, document_url, effective_from, active, created_at) FROM stdin;
aa33dfc0-d102-4d32-8fee-b7fc28b71af6	REGIS.TUTORING	Academic-Year Tutoring Agreement	2026-27	MVP policy snapshot for tutoring requests.	https://juliarosspt.com	2026-07-01 00:00:00+00	t	2026-08-01 16:35:46.611659+00
\.


--
-- Data for Name: price_book_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_book_lines (id, price_book_id, program, rate_tier, package_code, plan_code, amount_cents, registration_fee_cents, created_at) FROM stdin;
3e12a218-c566-45a4-8bd2-79feab7dad58	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	standard	std_2h	\N	46000	0	2026-08-12 01:38:42.579668+00
f9fdda3b-5e99-4d4d-b637-e8d661fc3974	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	standard	std_4h	\N	91000	0	2026-08-12 01:38:42.579668+00
1676b9cb-bb55-498a-9e30-aa983ac4f05b	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	standard	std_6h	\N	136000	0	2026-08-12 01:38:42.579668+00
01d97fa9-615d-4d18-9696-d8a520571676	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	standard	std_8h	\N	181000	0	2026-08-12 01:38:42.579668+00
e4963fb5-40d2-4da0-8124-dccb1e9e8be4	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	standard	std_hourly	\N	6500	0	2026-08-12 01:38:42.579668+00
199448fd-58cc-48ec-9587-20a89aade329	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	advanced	adv_2h	\N	60000	0	2026-08-12 01:38:42.579668+00
3bd72aa8-9e22-4fde-a74e-85ee85feb3c1	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	advanced	adv_4h	\N	120000	0	2026-08-12 01:38:42.579668+00
1bbfa9d3-37a5-4914-a7bf-eee6f723a651	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	advanced	adv_6h	\N	180000	0	2026-08-12 01:38:42.579668+00
71d7c678-d435-4ed8-9a97-23baa946dde5	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	advanced	adv_8h	\N	240000	0	2026-08-12 01:38:42.579668+00
dfce7211-416f-4993-b228-337ec16ada72	ddd64eb0-719b-4394-a1b4-3253419ed8d0	academic_tutoring	advanced	adv_hourly	\N	8500	0	2026-08-12 01:38:42.579668+00
2a0aede0-6b28-4b5d-bf62-0f18da32a840	ddd64eb0-719b-4394-a1b4-3253419ed8d0	summer_tutoring	standard	std_2h	\N	46000	0	2026-08-12 01:38:42.579668+00
e1784042-9cac-4bf7-bef3-f4636fa46241	ddd64eb0-719b-4394-a1b4-3253419ed8d0	summer_tutoring	standard	std_hourly	\N	6500	0	2026-08-12 01:38:42.579668+00
654af5e2-c602-4683-8941-b7931c961adf	ddd64eb0-719b-4394-a1b4-3253419ed8d0	summer_tutoring	advanced	adv_2h	\N	60000	0	2026-08-12 01:38:42.579668+00
017cd806-eb63-4f59-b563-416b98aa0e7d	ddd64eb0-719b-4394-a1b4-3253419ed8d0	summer_tutoring	advanced	adv_hourly	\N	8500	0	2026-08-12 01:38:42.579668+00
\.


--
-- Data for Name: price_books; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_books (id, code, name, effective_from, status, reason, created_by_staff_id, created_at, updated_at) FROM stdin;
ddd64eb0-719b-4394-a1b4-3253419ed8d0	PT-PRICE-2026.1	2026–27 catalog rates	2026-08-01 04:00:00+00	active	Seeded from form catalog tutoring packages. Card surcharge/late fees/intake remain locked at 0.	\N	2026-08-12 01:38:42.579668+00	2026-08-12 01:38:42.579668+00
\.


--
-- Data for Name: price_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_snapshots (id, label, currency, amount_cents, plan_label, fee_breakdown, source_catalog_id, created_at, price_book_id) FROM stdin;
\.


--
-- Data for Name: staff_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_profiles (id, clerk_user_id, email, full_name, role, active, created_at, updated_at) FROM stdin;
9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	user_3HK2ntjqFtLZuZAS0QLOUHxZTVf	ruddy@techma.ca	TestTechma IsTechmaTest	admin	t	2026-08-09 20:52:30.674902+00	2026-08-16 01:44:07.119+00
\.


--
-- Data for Name: student_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_notes (id, student_id, author_staff_id, author_display_name, body, created_at, editor_staff_id, editor_display_name, updated_at, deleted_at, deleted_by_staff_id) FROM stdin;
8d7b3d39-e477-4f52-a1eb-c22e13833fbe	fc6c0851-b54f-4c06-89ee-6acbe6c70aae	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	gfhdhbesrbesy sbwstensebr'stsebtsetbhebtsebtsebtesbtzsetne etbsebthcxc g cyndxyrd	2026-08-16 15:23:25.695291+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	2026-08-16 15:23:44.648+00	\N	\N
\.


--
-- Data for Name: student_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_subjects (id, student_id, subject_id, created_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, household_id, display_name, first_name, last_name, gender, school_name, graduation_year, grade_label, lifecycle, cell_phone, email, birthdate, support_notes_restricted, created_at, updated_at, learning_needs, availability_notes, emergency_contact, change_request_status, pending_intake_note, service_history, description, zoho_deal_id, zoho_deal_url, academic_year, preferred_schedule, hours_rate_package, advanced_hours_rate_package, payment_plan, deposit_cents, address_line1, address_line2, city, state, postal_code, country) FROM stdin;
1f6e573c-5d76-4550-a18f-f18f6f95bbfc	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	Techma Test	Techma	Test	M	Techma	2026	Grade 9	prospect	\N	\N	\N	\N	2026-08-10 15:56:45.536232+00	2026-08-10 15:56:45.536232+00	Algebra I	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	United States
fc6c0851-b54f-4c06-89ee-6acbe6c70aae	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	Test 2	Test	2	M	Techma	2026	Grade 12	prospect	\N	\N	\N	Another test	2026-08-10 16:15:40.298469+00	2026-08-14 15:59:03.035+00	Astronomy, AP Economics, Elementary School English, Middle School English, Latin	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	United States
68bed38c-6479-4b3d-abb3-b6bc1aece5a5	182ca09a-2300-469d-860a-15e2842f405e	Maya Lawson	Maya	Lawson	Other	Westfield High School	2027	Grade 11	prospect	+299077445364354	\N	\N	\N	2026-08-01 16:59:50.535458+00	2026-08-18 22:02:54.227+00	\N	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	United States
4e636602-6d9d-4061-ae36-18cc3993af0b	427652e9-a620-4e61-a2b1-f68715de41e0	Alex Martin1787161088402	Alex	Martin1787161088402	M	Test High	2029	grade_9	prospect	\N	\N	2010-04-12	504 extended time	2026-08-19 17:38:12.854579+00	2026-08-19 17:38:12.597+00	Algebra 1	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	monthly	\N	1 Main St	\N	Burke	VA	22015	United States
cb9c3b77-7de3-4799-af67-3b16834553a1	1bb87b0b-a031-4080-b6e0-286be066e257	Alex Phase1a1787171166269	Alex	Phase1a1787171166269	M	Test High	2029	grade_9	prospect	2025559812	\N	2010-04-12	\N	2026-08-19 20:26:11.535736+00	2026-08-19 20:26:11.159+00	Algebra 1	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	monthly	\N	1 Student Ln	\N	Burke	VA	22015	United States
4057e0fe-cc30-4500-875e-75b7c0b1ace5	e6a165ad-fb25-4d72-85ae-02108cd65779	Alex Phase1b1787171166269	Alex	Phase1b1787171166269	M	Test High	2029	grade_9	prospect	2025559825	\N	2010-04-12	\N	2026-08-19 20:26:17.893838+00	2026-08-19 20:26:17.505+00	Algebra 1	\N	\N	\N	\N	[]	\N	\N	\N	\N	\N	\N	\N	monthly	\N	1 Student Ln	\N	Burke	VA	22015	United States
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subjects (id, code, name, category, active, created_at) FROM stdin;
3c4016d9-8a40-4f01-805e-b39f3c645f0f	math	Mathematics	academic	t	2026-08-01 16:35:42.239944+00
8a71cbde-a529-4731-a2c7-feffc96680bc	english	English / Writing	academic	t	2026-08-01 16:35:43.135788+00
12229c25-c873-44c8-aba0-2054d9986060	science	Science	academic	t	2026-08-01 16:35:44.110646+00
6b5171db-6350-4ea4-a8ca-e6a558ec5aef	sat	SAT Prep	test-prep	t	2026-08-01 16:35:45.026473+00
5bbd28f0-9b5e-4b7a-9bbc-9f8176a1b8be	act	ACT Prep	test-prep	t	2026-08-01 16:35:45.824044+00
\.


--
-- Data for Name: support_case_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_case_messages (id, case_id, body, author_role, author_guardian_id, author_staff_id, created_at) FROM stdin;
bd64c87f-5102-4942-b9c7-025ecb0e053a	d7919ebf-33d3-4004-b947-e0f2df6c1ed7	Test	family	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	\N	2026-08-11 17:03:32.073082+00
5e6ab11c-f320-40f2-8bff-0950fe347113	d7919ebf-33d3-4004-b947-e0f2df6c1ed7	Submitted by Parent Guardian in Family Portal	system	\N	\N	2026-08-11 17:03:32.073082+00
b52fbfa9-15f7-4aa7-b251-1ff8f9b3c214	d7919ebf-33d3-4004-b947-e0f2df6c1ed7	In-app Staff Support badge incremented	system	\N	\N	2026-08-11 17:03:32.073082+00
87585396-4de2-417e-be2b-0ce0862262b8	d7919ebf-33d3-4004-b947-e0f2df6c1ed7	Status changed to Under review	system	\N	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	2026-08-11 22:53:39.394525+00
\.


--
-- Data for Name: support_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_cases (id, household_id, created_by_guardian_id, topic, priority, related_label, student_id, status, assignee_staff_id, created_at, updated_at) FROM stdin;
d7919ebf-33d3-4004-b947-e0f2df6c1ed7	f37582bc-e1ed-4d44-99f8-8c7fa8e48835	7ac34799-f1a1-4f4d-a93e-837295a9ca6a	Scheduling	normal	Techma Test	1f6e573c-5d76-4550-a18f-f18f6f95bbfc	under_review	\N	2026-08-11 17:03:31.700546+00	2026-08-11 22:53:38.319+00
\.


--
-- Data for Name: tutor_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutor_notes (id, tutor_id, author_staff_id, author_display_name, body, created_at, editor_staff_id, editor_display_name, updated_at, deleted_at, deleted_by_staff_id) FROM stdin;
2d300300-556c-494f-934e-09046b0a5e72	019850a8-bc88-453c-ba26-cf056b4eb200	\N	Migrated	Seeded Book Tutoring tutor	2026-08-16 14:22:01.348116+00	\N	\N	\N	\N	\N
20f83cfd-0732-4846-a114-8f74f988cc62	482851b1-c7de-4b0d-911a-269c5416cc0a	\N	Migrated	Seeded Book Tutoring tutor	2026-08-16 14:22:01.348116+00	\N	\N	\N	\N	\N
e39c13bb-809b-4d03-bfe3-2b24c81043bd	019850a8-bc88-453c-ba26-cf056b4eb200	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	Internal notes	2026-08-18 20:31:39.178971+00	9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c	TestTechma IsTechmaTest	2026-08-18 20:32:05.256+00	\N	\N
\.


--
-- Data for Name: tutor_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutor_subjects (id, tutor_id, subject_id, priority) FROM stdin;
5c59ec3a-0582-4a31-a17e-8f54b1b2b10c	6129aee2-8295-4a02-90c0-35c1ba221fbb	3c4016d9-8a40-4f01-805e-b39f3c645f0f	100
1514a965-1e19-4bb1-822b-8f4b200941c1	6129aee2-8295-4a02-90c0-35c1ba221fbb	8a71cbde-a529-4731-a2c7-feffc96680bc	100
58669de2-f6f8-41c6-aa31-67f0f3c390be	6129aee2-8295-4a02-90c0-35c1ba221fbb	12229c25-c873-44c8-aba0-2054d9986060	100
4241b216-f6ef-44ef-a34e-e64c67cd9896	6129aee2-8295-4a02-90c0-35c1ba221fbb	5bbd28f0-9b5e-4b7a-9bbc-9f8176a1b8be	100
77d2d11b-3b57-4896-b4da-c15f7634720e	482851b1-c7de-4b0d-911a-269c5416cc0a	3c4016d9-8a40-4f01-805e-b39f3c645f0f	0
c866d14d-f45a-46ac-ac16-cd003e7b0d90	482851b1-c7de-4b0d-911a-269c5416cc0a	12229c25-c873-44c8-aba0-2054d9986060	0
c5a01d85-656d-40e3-8872-7b1c0b37a32c	482851b1-c7de-4b0d-911a-269c5416cc0a	6b5171db-6350-4ea4-a8ca-e6a558ec5aef	0
41908197-c145-43c2-99c9-e209d19f400d	019850a8-bc88-453c-ba26-cf056b4eb200	8a71cbde-a529-4731-a2c7-feffc96680bc	0
36ad250f-f2d6-4863-9658-bdc3815cf4d3	019850a8-bc88-453c-ba26-cf056b4eb200	6b5171db-6350-4ea4-a8ca-e6a558ec5aef	0
c15e9a48-fc39-4b21-94f2-3f5414a05aaf	019850a8-bc88-453c-ba26-cf056b4eb200	5bbd28f0-9b5e-4b7a-9bbc-9f8176a1b8be	0
c200a197-23df-4f43-85be-b36b6676de0f	6129aee2-8295-4a02-90c0-35c1ba221fbb	6b5171db-6350-4ea4-a8ca-e6a558ec5aef	0
\.


--
-- Data for Name: tutoring_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutoring_requests (id, household_id, student_id, subject_id, requested_by_guardian_id, status, preferred_slot_id, schedule_notes, subject_notes, referral_source, package_label, policy_version_id, agreement_accepted_at, created_at, updated_at, form_id, schedule_window_id, payment_plan_id, payload) FROM stdin;
bcd5ade4-738c-4b03-8054-ae6d6abffe62	427652e9-a620-4e61-a2b1-f68715de41e0	4e636602-6d9d-4061-ae36-18cc3993af0b	3c4016d9-8a40-4f01-805e-b39f3c645f0f	8aff4bba-b7d6-49a0-81a5-955df7343b08	pending_staff_review	\N	\N	\N	friend	monthly	\N	2026-08-19 17:38:12.012+00	2026-08-19 17:38:12.854579+00	2026-08-19 17:38:14.224+00	academic_year_tutoring	tue_1715_1915	monthly	{"source": "public_ay_tutoring", "birthdate": "2010-04-12", "signatures": {"signedAt": "2026-08-19T17:38:12.012Z", "parentTypedName": "Pat Martin", "studentTypedName": "Alex Martin"}, "billingContact": {"city": "Burke", "email": "ay-bill-b-1787161088402@example.com", "phone": "7035550101", "state": "VA", "lastName": "Billing", "firstName": "Pat", "postalCode": "22015", "addressLine1": "9 Billing Rd", "addressLine2": null}, "schedulingPath": "pt_chooses", "altPaymentMethod": null, "hoursRatePackage": null, "householdAddress": {"city": "Burke", "state": "VA", "postalCode": "22015", "addressLine1": "1 Main St", "addressLine2": null}, "testPrepInterests": [], "catalogSubjectCode": "algebra_1", "preferredWindowIds": ["tue_1715_1915"], "autoChargePreference": null, "policyAcknowledgement": {"code": "PT-CAN-2026.3", "acceptedAt": "2026-08-19T17:38:12.012Z"}, "additionalSubjectCodes": [], "supportNotesRestricted": "504 extended time", "advancedHoursRatePackage": null, "billingContactIsSeparate": true}
9d7fe0dd-daef-4747-9338-be5ce5341604	1bb87b0b-a031-4080-b6e0-286be066e257	cb9c3b77-7de3-4799-af67-3b16834553a1	3c4016d9-8a40-4f01-805e-b39f3c645f0f	58ecc2ff-3a89-4a6e-a249-9d4a706fcbae	pending_staff_review	2d5099ba-642d-44c7-abe8-369ff12fadc9	\N	\N	friend	monthly	\N	2026-08-19 20:26:10.528+00	2026-08-19 20:26:11.535736+00	2026-08-19 20:26:13.103+00	academic_year_tutoring	sun_1500_1700	monthly	{"slotId": "2d5099ba-642d-44c7-abe8-369ff12fadc9", "source": "public_ay_tutoring", "tutorId": "6129aee2-8295-4a02-90c0-35c1ba221fbb", "windowId": "sun_1500_1700", "birthdate": "2010-04-12", "dayOfWeek": 0, "signatures": {"signedAt": "2026-08-19T20:26:10.528Z", "parentTypedName": "Pat Martin", "studentTypedName": "Alex Martin"}, "endTimeLocal": "17:00:00", "billingContact": {"city": "Burke", "email": "ay-bill-a-1787171166269@example.com", "phone": "2025559489", "state": "VA", "lastName": "Martin", "firstName": "Pat", "postalCode": "22015", "addressLine1": "9 Billing Rd", "addressLine2": null}, "schedulingPath": "family_selected", "startTimeLocal": "15:00:00", "altPaymentMethod": null, "hoursRatePackage": null, "householdAddress": {"city": "Burke", "state": "VA", "postalCode": "22015", "addressLine1": "1 Main St", "addressLine2": null}, "tutorDisplayName": "Alex Morgan", "openSeatsAtSubmit": 2, "testPrepInterests": [], "catalogSubjectCode": "algebra_1", "preferredWindowIds": ["sun_1500_1700"], "autoChargePreference": null, "policyAcknowledgement": {"code": "PT-CAN-2026.3", "acceptedAt": "2026-08-19T20:26:10.528Z"}, "additionalSubjectCodes": [], "supportNotesRestricted": null, "advancedHoursRatePackage": null, "billingContactIsSeparate": true}
c46dce5c-712d-47b8-9642-834384421f19	e6a165ad-fb25-4d72-85ae-02108cd65779	4057e0fe-cc30-4500-875e-75b7c0b1ace5	3c4016d9-8a40-4f01-805e-b39f3c645f0f	477b4c36-d5a6-4ef4-8ca2-1fd2dd005f33	confirmed	2d5099ba-642d-44c7-abe8-369ff12fadc9	\N	\N	friend	monthly	\N	2026-08-19 20:26:16.663+00	2026-08-19 20:26:17.893838+00	2026-08-19 20:26:23.339+00	academic_year_tutoring	sun_1500_1700	monthly	{"source": "public_ay_tutoring", "birthdate": "2010-04-12", "assignedAt": "2026-08-19T20:26:23.339Z", "signatures": {"signedAt": "2026-08-19T20:26:16.663Z", "parentTypedName": "Pat Martin", "studentTypedName": "Alex Martin"}, "assignedSlotId": "2d5099ba-642d-44c7-abe8-369ff12fadc9", "billingContact": {"city": "Burke", "email": "ay-bill-b-1787171166269@example.com", "phone": "2025559502", "state": "VA", "lastName": "Martin", "firstName": "Pat", "postalCode": "22015", "addressLine1": "9 Billing Rd", "addressLine2": null}, "schedulingPath": "pt_chooses", "assignedTutorId": "6129aee2-8295-4a02-90c0-35c1ba221fbb", "altPaymentMethod": null, "hoursRatePackage": null, "householdAddress": {"city": "Burke", "state": "VA", "postalCode": "22015", "addressLine1": "1 Main St", "addressLine2": null}, "assignedByStaffId": "9c15cb57-a2e2-40c7-86ae-b7c0e23c6b2c", "testPrepInterests": [], "catalogSubjectCode": "algebra_1", "preferredWindowIds": ["tue_1715_1915"], "autoChargePreference": null, "policyAcknowledgement": {"code": "PT-CAN-2026.3", "acceptedAt": "2026-08-19T20:26:16.663Z"}, "additionalSubjectCodes": [], "supportNotesRestricted": null, "advancedHoursRatePackage": null, "billingContactIsSeparate": true}
383246f4-e2aa-48ee-b173-9f9e9a4a803e	1bb87b0b-a031-4080-b6e0-286be066e257	cb9c3b77-7de3-4799-af67-3b16834553a1	3c4016d9-8a40-4f01-805e-b39f3c645f0f	\N	confirmed	2d5099ba-642d-44c7-abe8-369ff12fadc9	\N	\N	\N	\N	\N	\N	2026-08-19 20:26:30.966475+00	2026-08-19 20:26:30.369+00	\N	\N	\N	{"source": "staff_scheduling_acceptance"}
\.


--
-- Data for Name: tutors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutors (id, display_name, email, phone, active, max_seats_per_slot, notes, created_at, updated_at, address_line1, address_line2, city, state, postal_code, country) FROM stdin;
6129aee2-8295-4a02-90c0-35c1ba221fbb	Alex Morgan	tutor@example.com	\N	t	2	\N	2026-08-01 16:35:47.389534+00	2026-08-01 16:35:47.389534+00	\N	\N	\N	\N	\N	United States
482851b1-c7de-4b0d-911a-269c5416cc0a	Priya Shah	priya@example.com	\N	t	1	Seeded Book Tutoring tutor	2026-08-10 15:25:40.888722+00	2026-08-17 08:21:21.272+00	\N	\N	\N	\N	\N	United States
019850a8-bc88-453c-ba26-cf056b4eb200	Jordan Reed	jordan@example.com	\N	t	5	Seeded Book Tutoring tutor	2026-08-10 15:25:40.888722+00	2026-08-17 12:50:31.244+00	\N	\N	\N	\N	\N	United States
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-08-01 15:42:24
20211116045059	2026-08-01 15:42:24
20211116050929	2026-08-01 15:42:24
20211116051442	2026-08-01 15:42:24
20211116212300	2026-08-01 15:42:24
20211116213355	2026-08-01 15:42:24
20211116213934	2026-08-01 15:42:24
20211116214523	2026-08-01 15:42:24
20211122062447	2026-08-01 15:42:24
20211124070109	2026-08-01 15:42:24
20211202204204	2026-08-01 15:42:24
20211202204605	2026-08-01 15:42:24
20211210212804	2026-08-01 15:42:24
20211228014915	2026-08-01 15:42:24
20220107221237	2026-08-01 15:42:24
20220228202821	2026-08-01 15:42:24
20220312004840	2026-08-01 15:42:24
20220603231003	2026-08-01 15:42:24
20220603232444	2026-08-01 15:42:24
20220615214548	2026-08-01 15:42:24
20220712093339	2026-08-01 15:42:24
20220908172859	2026-08-01 15:42:24
20220916233421	2026-08-01 15:42:24
20230119133233	2026-08-01 15:42:24
20230128025114	2026-08-01 15:42:24
20230128025212	2026-08-01 15:42:24
20230227211149	2026-08-01 15:42:24
20230228184745	2026-08-01 15:42:24
20230308225145	2026-08-01 15:42:24
20230328144023	2026-08-01 15:42:24
20231018144023	2026-08-01 15:42:24
20231204144023	2026-08-01 15:42:24
20231204144024	2026-08-01 15:42:24
20231204144025	2026-08-01 15:42:24
20240108234812	2026-08-01 15:42:24
20240109165339	2026-08-01 15:42:24
20240227174441	2026-08-01 15:42:24
20240311171622	2026-08-01 15:42:24
20240321100241	2026-08-01 15:42:24
20240401105812	2026-08-01 15:42:24
20240418121054	2026-08-01 15:42:24
20240523004032	2026-08-01 15:42:24
20240618124746	2026-08-01 15:42:24
20240801235015	2026-08-01 15:42:24
20240805133720	2026-08-01 15:42:24
20240827160934	2026-08-01 15:42:24
20240919163303	2026-08-01 15:42:24
20240919163305	2026-08-01 15:42:24
20241019105805	2026-08-01 15:42:24
20241030150047	2026-08-01 15:42:24
20241108114728	2026-08-01 15:42:24
20241121104152	2026-08-01 15:42:24
20241130184212	2026-08-01 15:42:24
20241220035512	2026-08-01 15:42:24
20241220123912	2026-08-01 15:42:24
20241224161212	2026-08-01 15:42:24
20250107150512	2026-08-01 15:42:24
20250110162412	2026-08-01 15:42:24
20250123174212	2026-08-01 15:42:24
20250128220012	2026-08-01 15:42:24
20250506224012	2026-08-01 15:42:24
20250523164012	2026-08-01 15:42:24
20250714121412	2026-08-01 15:42:24
20250905041441	2026-08-01 15:42:24
20251103001201	2026-08-01 15:42:24
20251120212548	2026-08-01 15:42:24
20251120215549	2026-08-01 15:42:24
20260218120000	2026-08-01 15:42:24
20260326120000	2026-08-01 15:42:24
20260514120000	2026-08-01 15:42:24
20260527120000	2026-08-01 15:42:24
20260528120000	2026-08-01 15:42:24
20260603120000	2026-08-01 15:42:24
20260605120000	2026-08-01 15:42:24
20260606110000	2026-08-01 15:42:24
20260616120000	2026-08-01 15:42:24
20260624120000	2026-08-01 15:42:24
20260626120000	2026-08-01 15:42:24
20260706120000	2026-08-01 15:42:24
20260707120000	2026-08-01 15:42:24
20260709120000	2026-08-01 15:42:24
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type, versioning_status) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-08-01 13:25:27.145492
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-08-01 13:25:27.183027
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-08-01 13:25:27.18649
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-08-01 13:25:27.21272
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-08-01 13:25:27.225631
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-08-01 13:25:27.228765
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-08-01 13:25:27.23336
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-08-01 13:25:27.236944
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-08-01 13:25:27.240015
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-08-01 13:25:27.24339
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-08-01 13:25:27.246614
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-08-01 13:25:27.250939
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-08-01 13:25:27.254527
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-08-01 13:25:27.257818
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-08-01 13:25:27.261313
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-08-01 13:25:27.291479
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-08-01 13:25:27.295433
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-08-01 13:25:27.299314
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-08-01 13:25:27.302398
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-08-01 13:25:27.30694
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-08-01 13:25:27.311383
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-08-01 13:25:27.316305
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-08-01 13:25:27.33604
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-08-01 13:25:27.344019
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-08-01 13:25:27.348304
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-08-01 13:25:27.352918
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-08-01 13:25:27.356425
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-08-01 13:25:27.359274
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-08-01 13:25:27.362201
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-08-01 13:25:27.365133
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-08-01 13:25:27.368077
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-08-01 13:25:27.370856
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-08-01 13:25:27.373755
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-08-01 13:25:27.377357
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-08-01 13:25:27.380414
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-08-01 13:25:27.383359
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-08-01 13:25:27.386233
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-08-01 13:25:27.389927
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-08-01 13:25:27.39376
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-08-01 13:25:27.403218
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-08-01 13:25:27.406057
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-08-01 13:25:27.409237
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-08-01 13:25:27.414196
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-08-01 13:25:27.421144
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-08-01 13:25:27.424356
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-08-01 13:25:27.43052
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-08-01 13:25:27.440921
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-08-01 13:25:27.44611
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-08-01 13:25:27.450351
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-08-01 13:25:27.468513
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-08-01 13:25:27.472299
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-08-01 13:25:27.563968
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-08-01 13:25:27.565784
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-08-01 13:25:27.574344
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-08-01 13:25:27.576588
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-08-01 13:25:27.578183
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-08-01 13:25:27.5822
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-08-01 13:25:27.586489
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-08-01 13:25:27.590251
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-08-01 13:25:27.597393
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-08-01 13:25:27.601565
61	mark-filename-immutable	fe0096517ae9d60aaec1d110172ba9036dc66bb7	2026-08-13 18:11:43.414921
62	object-versioning-core	0b855f00ff3be0bfca91efee02a9858912491a9a	2026-08-19 21:55:17.238443
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, archived_at, is_delete_marker, is_versioned) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.schema_migrations (version, statements, name, created_by, idempotency_key, rollback) FROM stdin;
20260801153915	{"CREATE TYPE \\"public\\".\\"booking_status\\" AS ENUM('draft', 'held', 'pending_payment', 'pending_staff_review', 'confirmed', 'cancelled', 'failed');\nCREATE TYPE \\"public\\".\\"enrollment_status\\" AS ENUM('draft', 'submitted', 'waitlisted', 'confirmed', 'cancelled');\nCREATE TYPE \\"public\\".\\"household_status\\" AS ENUM('active', 'pending', 'inactive', 'archived');\nCREATE TYPE \\"public\\".\\"outbox_status\\" AS ENUM('pending', 'processing', 'sent', 'failed', 'dead');\nCREATE TYPE \\"public\\".\\"payment_status\\" AS ENUM('unpaid', 'pending', 'paid', 'partial', 'refunded', 'failed', 'waived');\nCREATE TYPE \\"public\\".\\"staff_role\\" AS ENUM('admin', 'scheduler', 'finance', 'support');\nCREATE TYPE \\"public\\".\\"student_lifecycle\\" AS ENUM('prospect', 'active', 'paused', 'completed', 'archived');\nCREATE TYPE \\"public\\".\\"tutoring_request_status\\" AS ENUM('draft', 'submitted', 'pending_staff_review', 'held', 'confirmed', 'cancelled', 'failed');\nCREATE TABLE \\"audit_events\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"actor_type\\" text NOT NULL,\n\t\\"actor_id\\" text,\n\t\\"action\\" text NOT NULL,\n\t\\"entity_type\\" text NOT NULL,\n\t\\"entity_id\\" text,\n\t\\"household_id\\" uuid,\n\t\\"correlation_id\\" text,\n\t\\"reason\\" text,\n\t\\"before_state\\" jsonb,\n\t\\"after_state\\" jsonb,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"availability_slots\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"tutor_id\\" uuid NOT NULL,\n\t\\"day_of_week\\" integer NOT NULL,\n\t\\"start_time_local\\" varchar(8) NOT NULL,\n\t\\"end_time_local\\" varchar(8) NOT NULL,\n\t\\"capacity_seats\\" integer DEFAULT 1 NOT NULL,\n\t\\"held_seats\\" integer DEFAULT 0 NOT NULL,\n\t\\"booked_seats\\" integer DEFAULT 0 NOT NULL,\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"label\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"bookings\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"tutoring_request_id\\" uuid NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"student_id\\" uuid NOT NULL,\n\t\\"subject_id\\" uuid NOT NULL,\n\t\\"tutor_id\\" uuid,\n\t\\"slot_id\\" uuid,\n\t\\"status\\" \\"booking_status\\" DEFAULT 'pending_staff_review' NOT NULL,\n\t\\"seats_claimed\\" integer DEFAULT 1 NOT NULL,\n\t\\"price_snapshot_id\\" uuid,\n\t\\"policy_version_id\\" uuid,\n\t\\"confirmed_by_staff_id\\" uuid,\n\t\\"confirmed_at\\" timestamp with time zone,\n\t\\"hold_expires_at\\" timestamp with time zone,\n\t\\"cancellation_reason\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"consent_evidence\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"guardian_id\\" uuid,\n\t\\"policy_version_id\\" uuid NOT NULL,\n\t\\"related_entity_type\\" text NOT NULL,\n\t\\"related_entity_id\\" uuid NOT NULL,\n\t\\"acknowledgement_text\\" text NOT NULL,\n\t\\"signed_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"ip_address\\" text,\n\t\\"user_agent\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"course_enrollments\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"course_offering_id\\" uuid NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"student_id\\" uuid NOT NULL,\n\t\\"requested_by_guardian_id\\" uuid,\n\t\\"status\\" \\"enrollment_status\\" DEFAULT 'submitted' NOT NULL,\n\t\\"requested_slot_preference\\" text,\n\t\\"price_snapshot_id\\" uuid,\n\t\\"policy_version_id\\" uuid,\n\t\\"notes\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"course_offerings\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"code\\" varchar(64) NOT NULL,\n\t\\"name\\" text NOT NULL,\n\t\\"description\\" text,\n\t\\"term_label\\" text,\n\t\\"schedule_summary\\" text,\n\t\\"capacity\\" integer DEFAULT 20 NOT NULL,\n\t\\"enrolled_count\\" integer DEFAULT 0 NOT NULL,\n\t\\"tuition_cents\\" integer DEFAULT 0 NOT NULL,\n\t\\"registration_fee_cents\\" integer DEFAULT 0 NOT NULL,\n\t\\"materials_fee_cents\\" integer DEFAULT 0 NOT NULL,\n\t\\"policy_version_id\\" uuid,\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"feature_flags\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"key\\" varchar(64) NOT NULL,\n\t\\"enabled\\" boolean DEFAULT false NOT NULL,\n\t\\"description\\" text,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"guardians\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"clerk_user_id\\" text,\n\t\\"email\\" text NOT NULL,\n\t\\"first_name\\" text NOT NULL,\n\t\\"last_name\\" text NOT NULL,\n\t\\"phone\\" varchar(40),\n\t\\"is_billing_owner\\" boolean DEFAULT false NOT NULL,\n\t\\"can_manage_students\\" boolean DEFAULT true NOT NULL,\n\t\\"can_request_services\\" boolean DEFAULT true NOT NULL,\n\t\\"invite_token\\" text,\n\t\\"invite_accepted_at\\" timestamp with time zone,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"households\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"display_name\\" text NOT NULL,\n\t\\"status\\" \\"household_status\\" DEFAULT 'pending' NOT NULL,\n\t\\"billing_owner_guardian_id\\" uuid,\n\t\\"primary_phone\\" varchar(40),\n\t\\"address_line1\\" text,\n\t\\"address_line2\\" text,\n\t\\"city\\" text,\n\t\\"state\\" varchar(40),\n\t\\"postal_code\\" varchar(20),\n\t\\"timezone\\" text DEFAULT 'America/New_York' NOT NULL,\n\t\\"notes\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"integration_inbox\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"provider\\" varchar(32) NOT NULL,\n\t\\"external_event_id\\" text NOT NULL,\n\t\\"event_type\\" text NOT NULL,\n\t\\"payload\\" jsonb NOT NULL,\n\t\\"processed\\" boolean DEFAULT false NOT NULL,\n\t\\"processed_at\\" timestamp with time zone,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"integration_outbox\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"provider\\" varchar(32) NOT NULL,\n\t\\"event_type\\" text NOT NULL,\n\t\\"payload\\" jsonb NOT NULL,\n\t\\"idempotency_key\\" text NOT NULL,\n\t\\"status\\" \\"outbox_status\\" DEFAULT 'pending' NOT NULL,\n\t\\"attempts\\" integer DEFAULT 0 NOT NULL,\n\t\\"last_error\\" text,\n\t\\"correlation_id\\" text,\n\t\\"available_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"processed_at\\" timestamp with time zone,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"payment_records\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"related_entity_type\\" text NOT NULL,\n\t\\"related_entity_id\\" uuid NOT NULL,\n\t\\"status\\" \\"payment_status\\" DEFAULT 'unpaid' NOT NULL,\n\t\\"amount_cents\\" integer NOT NULL,\n\t\\"currency\\" varchar(3) DEFAULT 'USD' NOT NULL,\n\t\\"method_label\\" text,\n\t\\"recorded_by_staff_id\\" uuid,\n\t\\"notes\\" text,\n\t\\"stripe_payment_intent_id\\" text,\n\t\\"stripe_customer_id\\" text,\n\t\\"paid_at\\" timestamp with time zone,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"policy_versions\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"code\\" varchar(64) NOT NULL,\n\t\\"title\\" text NOT NULL,\n\t\\"version_label\\" text NOT NULL,\n\t\\"body_summary\\" text,\n\t\\"document_url\\" text,\n\t\\"effective_from\\" timestamp with time zone NOT NULL,\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"price_snapshots\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"label\\" text NOT NULL,\n\t\\"currency\\" varchar(3) DEFAULT 'USD' NOT NULL,\n\t\\"amount_cents\\" integer NOT NULL,\n\t\\"plan_label\\" text,\n\t\\"fee_breakdown\\" jsonb,\n\t\\"source_catalog_id\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"staff_profiles\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"clerk_user_id\\" text NOT NULL,\n\t\\"email\\" text NOT NULL,\n\t\\"full_name\\" text NOT NULL,\n\t\\"role\\" \\"staff_role\\" DEFAULT 'support' NOT NULL,\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"students\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"display_name\\" text NOT NULL,\n\t\\"first_name\\" text NOT NULL,\n\t\\"last_name\\" text NOT NULL,\n\t\\"gender\\" text,\n\t\\"school_name\\" text,\n\t\\"graduation_year\\" integer,\n\t\\"grade_label\\" text,\n\t\\"lifecycle\\" \\"student_lifecycle\\" DEFAULT 'prospect' NOT NULL,\n\t\\"cell_phone\\" varchar(40),\n\t\\"email\\" text,\n\t\\"birthdate\\" text,\n\t\\"support_notes_restricted\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"subjects\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"code\\" varchar(64) NOT NULL,\n\t\\"name\\" text NOT NULL,\n\t\\"category\\" text,\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"tutor_subjects\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"tutor_id\\" uuid NOT NULL,\n\t\\"subject_id\\" uuid NOT NULL,\n\t\\"priority\\" integer DEFAULT 100 NOT NULL\n);\nCREATE TABLE \\"tutoring_requests\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"household_id\\" uuid NOT NULL,\n\t\\"student_id\\" uuid NOT NULL,\n\t\\"subject_id\\" uuid NOT NULL,\n\t\\"requested_by_guardian_id\\" uuid,\n\t\\"status\\" \\"tutoring_request_status\\" DEFAULT 'draft' NOT NULL,\n\t\\"preferred_slot_id\\" uuid,\n\t\\"schedule_notes\\" text,\n\t\\"subject_notes\\" text,\n\t\\"referral_source\\" text,\n\t\\"package_label\\" text,\n\t\\"policy_version_id\\" uuid,\n\t\\"agreement_accepted_at\\" timestamp with time zone,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nCREATE TABLE \\"tutors\\" (\n\t\\"id\\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\\"display_name\\" text NOT NULL,\n\t\\"email\\" text,\n\t\\"phone\\" varchar(40),\n\t\\"active\\" boolean DEFAULT true NOT NULL,\n\t\\"max_seats_per_slot\\" integer DEFAULT 1 NOT NULL,\n\t\\"notes\\" text,\n\t\\"created_at\\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\\"updated_at\\" timestamp with time zone DEFAULT now() NOT NULL\n);\nALTER TABLE \\"availability_slots\\" ADD CONSTRAINT \\"availability_slots_tutor_id_tutors_id_fk\\" FOREIGN KEY (\\"tutor_id\\") REFERENCES \\"public\\".\\"tutors\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_tutoring_request_id_tutoring_requests_id_fk\\" FOREIGN KEY (\\"tutoring_request_id\\") REFERENCES \\"public\\".\\"tutoring_requests\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_student_id_students_id_fk\\" FOREIGN KEY (\\"student_id\\") REFERENCES \\"public\\".\\"students\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_subject_id_subjects_id_fk\\" FOREIGN KEY (\\"subject_id\\") REFERENCES \\"public\\".\\"subjects\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_tutor_id_tutors_id_fk\\" FOREIGN KEY (\\"tutor_id\\") REFERENCES \\"public\\".\\"tutors\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_slot_id_availability_slots_id_fk\\" FOREIGN KEY (\\"slot_id\\") REFERENCES \\"public\\".\\"availability_slots\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_price_snapshot_id_price_snapshots_id_fk\\" FOREIGN KEY (\\"price_snapshot_id\\") REFERENCES \\"public\\".\\"price_snapshots\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_policy_version_id_policy_versions_id_fk\\" FOREIGN KEY (\\"policy_version_id\\") REFERENCES \\"public\\".\\"policy_versions\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"bookings\\" ADD CONSTRAINT \\"bookings_confirmed_by_staff_id_staff_profiles_id_fk\\" FOREIGN KEY (\\"confirmed_by_staff_id\\") REFERENCES \\"public\\".\\"staff_profiles\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"consent_evidence\\" ADD CONSTRAINT \\"consent_evidence_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"consent_evidence\\" ADD CONSTRAINT \\"consent_evidence_guardian_id_guardians_id_fk\\" FOREIGN KEY (\\"guardian_id\\") REFERENCES \\"public\\".\\"guardians\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"consent_evidence\\" ADD CONSTRAINT \\"consent_evidence_policy_version_id_policy_versions_id_fk\\" FOREIGN KEY (\\"policy_version_id\\") REFERENCES \\"public\\".\\"policy_versions\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_course_offering_id_course_offerings_id_fk\\" FOREIGN KEY (\\"course_offering_id\\") REFERENCES \\"public\\".\\"course_offerings\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_student_id_students_id_fk\\" FOREIGN KEY (\\"student_id\\") REFERENCES \\"public\\".\\"students\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_requested_by_guardian_id_guardians_id_fk\\" FOREIGN KEY (\\"requested_by_guardian_id\\") REFERENCES \\"public\\".\\"guardians\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_price_snapshot_id_price_snapshots_id_fk\\" FOREIGN KEY (\\"price_snapshot_id\\") REFERENCES \\"public\\".\\"price_snapshots\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_enrollments\\" ADD CONSTRAINT \\"course_enrollments_policy_version_id_policy_versions_id_fk\\" FOREIGN KEY (\\"policy_version_id\\") REFERENCES \\"public\\".\\"policy_versions\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"course_offerings\\" ADD CONSTRAINT \\"course_offerings_policy_version_id_policy_versions_id_fk\\" FOREIGN KEY (\\"policy_version_id\\") REFERENCES \\"public\\".\\"policy_versions\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"guardians\\" ADD CONSTRAINT \\"guardians_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"payment_records\\" ADD CONSTRAINT \\"payment_records_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"payment_records\\" ADD CONSTRAINT \\"payment_records_recorded_by_staff_id_staff_profiles_id_fk\\" FOREIGN KEY (\\"recorded_by_staff_id\\") REFERENCES \\"public\\".\\"staff_profiles\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"students\\" ADD CONSTRAINT \\"students_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"tutor_subjects\\" ADD CONSTRAINT \\"tutor_subjects_tutor_id_tutors_id_fk\\" FOREIGN KEY (\\"tutor_id\\") REFERENCES \\"public\\".\\"tutors\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"tutor_subjects\\" ADD CONSTRAINT \\"tutor_subjects_subject_id_subjects_id_fk\\" FOREIGN KEY (\\"subject_id\\") REFERENCES \\"public\\".\\"subjects\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_household_id_households_id_fk\\" FOREIGN KEY (\\"household_id\\") REFERENCES \\"public\\".\\"households\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_student_id_students_id_fk\\" FOREIGN KEY (\\"student_id\\") REFERENCES \\"public\\".\\"students\\"(\\"id\\") ON DELETE cascade ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_subject_id_subjects_id_fk\\" FOREIGN KEY (\\"subject_id\\") REFERENCES \\"public\\".\\"subjects\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_requested_by_guardian_id_guardians_id_fk\\" FOREIGN KEY (\\"requested_by_guardian_id\\") REFERENCES \\"public\\".\\"guardians\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_preferred_slot_id_availability_slots_id_fk\\" FOREIGN KEY (\\"preferred_slot_id\\") REFERENCES \\"public\\".\\"availability_slots\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nALTER TABLE \\"tutoring_requests\\" ADD CONSTRAINT \\"tutoring_requests_policy_version_id_policy_versions_id_fk\\" FOREIGN KEY (\\"policy_version_id\\") REFERENCES \\"public\\".\\"policy_versions\\"(\\"id\\") ON DELETE no action ON UPDATE no action;\nCREATE INDEX \\"audit_events_entity_idx\\" ON \\"audit_events\\" USING btree (\\"entity_type\\",\\"entity_id\\");\nCREATE INDEX \\"audit_events_household_id_idx\\" ON \\"audit_events\\" USING btree (\\"household_id\\");\nCREATE INDEX \\"audit_events_created_at_idx\\" ON \\"audit_events\\" USING btree (\\"created_at\\");\nCREATE INDEX \\"availability_slots_tutor_id_idx\\" ON \\"availability_slots\\" USING btree (\\"tutor_id\\");\nCREATE INDEX \\"bookings_household_id_idx\\" ON \\"bookings\\" USING btree (\\"household_id\\");\nCREATE INDEX \\"bookings_status_idx\\" ON \\"bookings\\" USING btree (\\"status\\");\nCREATE INDEX \\"bookings_slot_id_idx\\" ON \\"bookings\\" USING btree (\\"slot_id\\");\nCREATE INDEX \\"course_enrollments_household_id_idx\\" ON \\"course_enrollments\\" USING btree (\\"household_id\\");\nCREATE INDEX \\"course_enrollments_course_id_idx\\" ON \\"course_enrollments\\" USING btree (\\"course_offering_id\\");\nCREATE UNIQUE INDEX \\"feature_flags_key_uidx\\" ON \\"feature_flags\\" USING btree (\\"key\\");\nCREATE UNIQUE INDEX \\"guardians_clerk_user_id_uidx\\" ON \\"guardians\\" USING btree (\\"clerk_user_id\\");\nCREATE INDEX \\"guardians_household_id_idx\\" ON \\"guardians\\" USING btree (\\"household_id\\");\nCREATE UNIQUE INDEX \\"integration_inbox_provider_event_uidx\\" ON \\"integration_inbox\\" USING btree (\\"provider\\",\\"external_event_id\\");\nCREATE UNIQUE INDEX \\"integration_outbox_idempotency_uidx\\" ON \\"integration_outbox\\" USING btree (\\"idempotency_key\\");\nCREATE INDEX \\"integration_outbox_status_idx\\" ON \\"integration_outbox\\" USING btree (\\"status\\");\nCREATE INDEX \\"payment_records_household_id_idx\\" ON \\"payment_records\\" USING btree (\\"household_id\\");\nCREATE INDEX \\"payment_records_related_idx\\" ON \\"payment_records\\" USING btree (\\"related_entity_type\\",\\"related_entity_id\\");\nCREATE UNIQUE INDEX \\"policy_versions_code_version_uidx\\" ON \\"policy_versions\\" USING btree (\\"code\\",\\"version_label\\");\nCREATE UNIQUE INDEX \\"staff_profiles_clerk_user_id_uidx\\" ON \\"staff_profiles\\" USING btree (\\"clerk_user_id\\");\nCREATE INDEX \\"students_household_id_idx\\" ON \\"students\\" USING btree (\\"household_id\\");\nCREATE UNIQUE INDEX \\"subjects_code_uidx\\" ON \\"subjects\\" USING btree (\\"code\\");\nCREATE UNIQUE INDEX \\"tutor_subjects_tutor_subject_uidx\\" ON \\"tutor_subjects\\" USING btree (\\"tutor_id\\",\\"subject_id\\");\nCREATE INDEX \\"tutoring_requests_household_id_idx\\" ON \\"tutoring_requests\\" USING btree (\\"household_id\\");\nCREATE INDEX \\"tutoring_requests_status_idx\\" ON \\"tutoring_requests\\" USING btree (\\"status\\");"}	init_mvp	rwhandenon.rw@gmail.com	\N	\N
20260806175528	{"-- Enable RLS on all app tables. No anon/authenticated policies:\n-- public Data API stays locked; server DATABASE_URL (postgres/service) continues to work.\nALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.consent_evidence ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.households ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.integration_inbox ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.integration_outbox ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.students ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.tutoring_requests ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;"}	enable_rls_all_public_tables	rwhandenon.rw@gmail.com	\N	\N
20260810071718	{"ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_needs text;"}	add_students_learning_needs	rwhandenon.rw@gmail.com	\N	\N
20260810152358	{"-- Household Stripe card-on-file (tokens + consent only)\nALTER TABLE households\n  ADD COLUMN IF NOT EXISTS stripe_customer_id text,\n  ADD COLUMN IF NOT EXISTS stripe_default_payment_method_id text,\n  ADD COLUMN IF NOT EXISTS card_brand text,\n  ADD COLUMN IF NOT EXISTS card_last4 varchar(4),\n  ADD COLUMN IF NOT EXISTS payment_method_consent_at timestamptz,\n  ADD COLUMN IF NOT EXISTS payment_method_consent_version text;\n\n-- Link slots to catalog schedule window ids\nALTER TABLE availability_slots\n  ADD COLUMN IF NOT EXISTS schedule_window_id varchar(64);\n\n-- Extra tutoring request fields for catalog booking\nALTER TABLE tutoring_requests\n  ADD COLUMN IF NOT EXISTS form_id text,\n  ADD COLUMN IF NOT EXISTS schedule_window_id varchar(64),\n  ADD COLUMN IF NOT EXISTS payment_plan_id varchar(64),\n  ADD COLUMN IF NOT EXISTS payload jsonb;\n"}	book_tutoring_stripe_and_windows	rwhandenon.rw@gmail.com	\N	\N
20260810171606	{"ALTER TABLE public.students\n  ADD COLUMN IF NOT EXISTS availability_notes text,\n  ADD COLUMN IF NOT EXISTS emergency_contact text,\n  ADD COLUMN IF NOT EXISTS change_request_status text,\n  ADD COLUMN IF NOT EXISTS pending_intake_note text,\n  ADD COLUMN IF NOT EXISTS service_history jsonb NOT NULL DEFAULT '[]'::jsonb;"}	student_guardian_edit_fields	rwhandenon.rw@gmail.com	\N	\N
20260810180335	{"DO $$ BEGIN\n  CREATE TYPE public.change_request_status AS ENUM (\n    'submitted',\n    'under_review',\n    'approved',\n    'declined',\n    'applied'\n  );\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\nEND $$;\n\nCREATE TABLE IF NOT EXISTS public.change_requests (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  household_id uuid NOT NULL,\n  student_id uuid NOT NULL,\n  requested_by_guardian_id uuid,\n  related_entity_type text NOT NULL,\n  related_entity_id uuid NOT NULL,\n  change_type text NOT NULL,\n  reason text NOT NULL,\n  requested_outcome text NOT NULL,\n  preferred_alternatives text,\n  policy_recommendation text NOT NULL,\n  status public.change_request_status NOT NULL DEFAULT 'submitted',\n  staff_notes text,\n  resolved_by_staff_id uuid,\n  resolved_at timestamptz,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  updated_at timestamptz NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS change_requests_household_idx ON public.change_requests (household_id);\nCREATE INDEX IF NOT EXISTS change_requests_related_idx ON public.change_requests (related_entity_type, related_entity_id);\n\nALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;"}	create_change_requests	rwhandenon.rw@gmail.com	\N	\N
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cancellation_policy_versions cancellation_policy_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_policy_versions
    ADD CONSTRAINT cancellation_policy_versions_pkey PRIMARY KEY (id);


--
-- Name: change_requests change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_requests
    ADD CONSTRAINT change_requests_pkey PRIMARY KEY (id);


--
-- Name: consent_evidence consent_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_evidence
    ADD CONSTRAINT consent_evidence_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_offerings course_offerings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT course_offerings_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: guardian_notes guardian_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_notes
    ADD CONSTRAINT guardian_notes_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: household_notes household_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_notes
    ADD CONSTRAINT household_notes_pkey PRIMARY KEY (id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: identity_merge_requests identity_merge_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_merge_requests
    ADD CONSTRAINT identity_merge_requests_pkey PRIMARY KEY (id);


--
-- Name: integration_inbox integration_inbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_inbox
    ADD CONSTRAINT integration_inbox_pkey PRIMARY KEY (id);


--
-- Name: integration_outbox integration_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_outbox
    ADD CONSTRAINT integration_outbox_pkey PRIMARY KEY (id);


--
-- Name: payment_records payment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_pkey PRIMARY KEY (id);


--
-- Name: policy_versions policy_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_versions
    ADD CONSTRAINT policy_versions_pkey PRIMARY KEY (id);


--
-- Name: price_book_lines price_book_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_lines
    ADD CONSTRAINT price_book_lines_pkey PRIMARY KEY (id);


--
-- Name: price_books price_books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_books
    ADD CONSTRAINT price_books_pkey PRIMARY KEY (id);


--
-- Name: price_snapshots price_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_snapshots
    ADD CONSTRAINT price_snapshots_pkey PRIMARY KEY (id);


--
-- Name: staff_profiles staff_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_pkey PRIMARY KEY (id);


--
-- Name: student_notes student_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_pkey PRIMARY KEY (id);


--
-- Name: student_subjects student_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: support_case_messages support_case_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_case_messages
    ADD CONSTRAINT support_case_messages_pkey PRIMARY KEY (id);


--
-- Name: support_cases support_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_cases
    ADD CONSTRAINT support_cases_pkey PRIMARY KEY (id);


--
-- Name: tutor_notes tutor_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_notes
    ADD CONSTRAINT tutor_notes_pkey PRIMARY KEY (id);


--
-- Name: tutor_subjects tutor_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_pkey PRIMARY KEY (id);


--
-- Name: tutoring_requests tutoring_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_pkey PRIMARY KEY (id);


--
-- Name: tutors tutors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutors
    ADD CONSTRAINT tutors_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: audit_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_created_at_idx ON public.audit_events USING btree (created_at);


--
-- Name: audit_events_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_entity_idx ON public.audit_events USING btree (entity_type, entity_id);


--
-- Name: audit_events_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_household_id_idx ON public.audit_events USING btree (household_id);


--
-- Name: availability_slots_tutor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX availability_slots_tutor_id_idx ON public.availability_slots USING btree (tutor_id);


--
-- Name: bookings_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_household_id_idx ON public.bookings USING btree (household_id);


--
-- Name: bookings_slot_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_slot_id_idx ON public.bookings USING btree (slot_id);


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: cancellation_policy_versions_kind_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cancellation_policy_versions_kind_status_idx ON public.cancellation_policy_versions USING btree (kind, status);


--
-- Name: change_requests_household_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX change_requests_household_idx ON public.change_requests USING btree (household_id);


--
-- Name: change_requests_related_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX change_requests_related_idx ON public.change_requests USING btree (related_entity_type, related_entity_id);


--
-- Name: course_enrollments_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_enrollments_course_id_idx ON public.course_enrollments USING btree (course_offering_id);


--
-- Name: course_enrollments_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_enrollments_household_id_idx ON public.course_enrollments USING btree (household_id);


--
-- Name: feature_flags_key_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX feature_flags_key_uidx ON public.feature_flags USING btree (key);


--
-- Name: guardian_notes_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guardian_notes_deleted_at_idx ON public.guardian_notes USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: guardian_notes_guardian_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guardian_notes_guardian_created_idx ON public.guardian_notes USING btree (guardian_id, created_at DESC);


--
-- Name: guardians_clerk_user_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX guardians_clerk_user_id_uidx ON public.guardians USING btree (clerk_user_id);


--
-- Name: guardians_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guardians_household_id_idx ON public.guardians USING btree (household_id);


--
-- Name: guardians_household_parent_1_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX guardians_household_parent_1_uidx ON public.guardians USING btree (household_id) WHERE ((relationship_role = 'parent_1'::public.guardian_relationship_role) AND (household_id IS NOT NULL));


--
-- Name: guardians_household_parent_2_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX guardians_household_parent_2_uidx ON public.guardians USING btree (household_id) WHERE ((relationship_role = 'parent_2'::public.guardian_relationship_role) AND (household_id IS NOT NULL));


--
-- Name: household_notes_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_notes_deleted_at_idx ON public.household_notes USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: household_notes_household_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX household_notes_household_created_idx ON public.household_notes USING btree (household_id, created_at DESC);


--
-- Name: identity_merge_requests_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_merge_requests_created_at_idx ON public.identity_merge_requests USING btree (created_at DESC);


--
-- Name: identity_merge_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_merge_requests_status_idx ON public.identity_merge_requests USING btree (status);


--
-- Name: integration_inbox_provider_event_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX integration_inbox_provider_event_uidx ON public.integration_inbox USING btree (provider, external_event_id);


--
-- Name: integration_outbox_idempotency_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX integration_outbox_idempotency_uidx ON public.integration_outbox USING btree (idempotency_key);


--
-- Name: integration_outbox_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integration_outbox_status_idx ON public.integration_outbox USING btree (status);


--
-- Name: payment_records_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_records_household_id_idx ON public.payment_records USING btree (household_id);


--
-- Name: payment_records_related_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_records_related_idx ON public.payment_records USING btree (related_entity_type, related_entity_id);


--
-- Name: policy_versions_code_version_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX policy_versions_code_version_uidx ON public.policy_versions USING btree (code, version_label);


--
-- Name: price_book_lines_book_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_book_lines_book_idx ON public.price_book_lines USING btree (price_book_id);


--
-- Name: price_books_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_books_status_idx ON public.price_books USING btree (status);


--
-- Name: staff_profiles_clerk_user_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX staff_profiles_clerk_user_id_uidx ON public.staff_profiles USING btree (clerk_user_id);


--
-- Name: student_notes_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_notes_deleted_at_idx ON public.student_notes USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: student_notes_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_notes_student_id_idx ON public.student_notes USING btree (student_id);


--
-- Name: student_subjects_student_id_subject_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX student_subjects_student_id_subject_id_uidx ON public.student_subjects USING btree (student_id, subject_id);


--
-- Name: students_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX students_household_id_idx ON public.students USING btree (household_id);


--
-- Name: subjects_code_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subjects_code_uidx ON public.subjects USING btree (code);


--
-- Name: tutor_notes_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutor_notes_deleted_at_idx ON public.tutor_notes USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: tutor_notes_tutor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutor_notes_tutor_id_idx ON public.tutor_notes USING btree (tutor_id);


--
-- Name: tutor_subjects_tutor_id_subject_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tutor_subjects_tutor_id_subject_id_uidx ON public.tutor_subjects USING btree (tutor_id, subject_id);


--
-- Name: tutor_subjects_tutor_subject_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tutor_subjects_tutor_subject_uidx ON public.tutor_subjects USING btree (tutor_id, subject_id);


--
-- Name: tutoring_requests_household_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutoring_requests_household_id_idx ON public.tutoring_requests USING btree (household_id);


--
-- Name: tutoring_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutoring_requests_status_idx ON public.tutoring_requests USING btree (status);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: availability_slots availability_slots_tutor_id_tutors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_tutor_id_tutors_id_fk FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_confirmed_by_staff_id_staff_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_confirmed_by_staff_id_staff_profiles_id_fk FOREIGN KEY (confirmed_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: bookings bookings_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: bookings bookings_policy_version_id_policy_versions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_policy_version_id_policy_versions_id_fk FOREIGN KEY (policy_version_id) REFERENCES public.policy_versions(id);


--
-- Name: bookings bookings_price_snapshot_id_price_snapshots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_price_snapshot_id_price_snapshots_id_fk FOREIGN KEY (price_snapshot_id) REFERENCES public.price_snapshots(id);


--
-- Name: bookings bookings_slot_id_availability_slots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_slot_id_availability_slots_id_fk FOREIGN KEY (slot_id) REFERENCES public.availability_slots(id);


--
-- Name: bookings bookings_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: bookings bookings_subject_id_subjects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_subject_id_subjects_id_fk FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: bookings bookings_tutor_id_tutors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tutor_id_tutors_id_fk FOREIGN KEY (tutor_id) REFERENCES public.tutors(id);


--
-- Name: bookings bookings_tutoring_request_id_tutoring_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tutoring_request_id_tutoring_requests_id_fk FOREIGN KEY (tutoring_request_id) REFERENCES public.tutoring_requests(id);


--
-- Name: consent_evidence consent_evidence_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_evidence
    ADD CONSTRAINT consent_evidence_guardian_id_guardians_id_fk FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- Name: consent_evidence consent_evidence_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_evidence
    ADD CONSTRAINT consent_evidence_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: consent_evidence consent_evidence_policy_version_id_policy_versions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_evidence
    ADD CONSTRAINT consent_evidence_policy_version_id_policy_versions_id_fk FOREIGN KEY (policy_version_id) REFERENCES public.policy_versions(id);


--
-- Name: course_enrollments course_enrollments_course_offering_id_course_offerings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_offering_id_course_offerings_id_fk FOREIGN KEY (course_offering_id) REFERENCES public.course_offerings(id);


--
-- Name: course_enrollments course_enrollments_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: course_enrollments course_enrollments_policy_version_id_policy_versions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_policy_version_id_policy_versions_id_fk FOREIGN KEY (policy_version_id) REFERENCES public.policy_versions(id);


--
-- Name: course_enrollments course_enrollments_price_snapshot_id_price_snapshots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_price_snapshot_id_price_snapshots_id_fk FOREIGN KEY (price_snapshot_id) REFERENCES public.price_snapshots(id);


--
-- Name: course_enrollments course_enrollments_requested_by_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_requested_by_guardian_id_guardians_id_fk FOREIGN KEY (requested_by_guardian_id) REFERENCES public.guardians(id);


--
-- Name: course_enrollments course_enrollments_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: course_offerings course_offerings_policy_version_id_policy_versions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT course_offerings_policy_version_id_policy_versions_id_fk FOREIGN KEY (policy_version_id) REFERENCES public.policy_versions(id);


--
-- Name: guardian_notes guardian_notes_author_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_notes
    ADD CONSTRAINT guardian_notes_author_staff_id_fkey FOREIGN KEY (author_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: guardian_notes guardian_notes_deleted_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_notes
    ADD CONSTRAINT guardian_notes_deleted_by_staff_id_fkey FOREIGN KEY (deleted_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: guardian_notes guardian_notes_editor_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_notes
    ADD CONSTRAINT guardian_notes_editor_staff_id_fkey FOREIGN KEY (editor_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: guardian_notes guardian_notes_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_notes
    ADD CONSTRAINT guardian_notes_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- Name: guardians guardians_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_notes household_notes_author_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_notes
    ADD CONSTRAINT household_notes_author_staff_id_fkey FOREIGN KEY (author_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: household_notes household_notes_deleted_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_notes
    ADD CONSTRAINT household_notes_deleted_by_staff_id_fkey FOREIGN KEY (deleted_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: household_notes household_notes_editor_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_notes
    ADD CONSTRAINT household_notes_editor_staff_id_fkey FOREIGN KEY (editor_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: household_notes household_notes_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.household_notes
    ADD CONSTRAINT household_notes_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: identity_merge_requests identity_merge_requests_source_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_merge_requests
    ADD CONSTRAINT identity_merge_requests_source_household_id_fkey FOREIGN KEY (source_household_id) REFERENCES public.households(id);


--
-- Name: identity_merge_requests identity_merge_requests_target_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_merge_requests
    ADD CONSTRAINT identity_merge_requests_target_household_id_fkey FOREIGN KEY (target_household_id) REFERENCES public.households(id);


--
-- Name: payment_records payment_records_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id);


--
-- Name: payment_records payment_records_recorded_by_staff_id_staff_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_recorded_by_staff_id_staff_profiles_id_fk FOREIGN KEY (recorded_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: price_book_lines price_book_lines_price_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_book_lines
    ADD CONSTRAINT price_book_lines_price_book_id_fkey FOREIGN KEY (price_book_id) REFERENCES public.price_books(id);


--
-- Name: student_notes student_notes_author_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_author_staff_id_fkey FOREIGN KEY (author_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: student_notes student_notes_deleted_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_deleted_by_staff_id_fkey FOREIGN KEY (deleted_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: student_notes student_notes_editor_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_editor_staff_id_fkey FOREIGN KEY (editor_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: student_notes student_notes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_subjects student_subjects_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_subjects student_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: students students_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: tutor_notes tutor_notes_author_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_notes
    ADD CONSTRAINT tutor_notes_author_staff_id_fkey FOREIGN KEY (author_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: tutor_notes tutor_notes_deleted_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_notes
    ADD CONSTRAINT tutor_notes_deleted_by_staff_id_fkey FOREIGN KEY (deleted_by_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: tutor_notes tutor_notes_editor_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_notes
    ADD CONSTRAINT tutor_notes_editor_staff_id_fkey FOREIGN KEY (editor_staff_id) REFERENCES public.staff_profiles(id);


--
-- Name: tutor_notes tutor_notes_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_notes
    ADD CONSTRAINT tutor_notes_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;


--
-- Name: tutor_subjects tutor_subjects_subject_id_subjects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_subject_id_subjects_id_fk FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: tutor_subjects tutor_subjects_tutor_id_tutors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_tutor_id_tutors_id_fk FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;


--
-- Name: tutoring_requests tutoring_requests_household_id_households_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_household_id_households_id_fk FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: tutoring_requests tutoring_requests_policy_version_id_policy_versions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_policy_version_id_policy_versions_id_fk FOREIGN KEY (policy_version_id) REFERENCES public.policy_versions(id);


--
-- Name: tutoring_requests tutoring_requests_preferred_slot_id_availability_slots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_preferred_slot_id_availability_slots_id_fk FOREIGN KEY (preferred_slot_id) REFERENCES public.availability_slots(id);


--
-- Name: tutoring_requests tutoring_requests_requested_by_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_requested_by_guardian_id_guardians_id_fk FOREIGN KEY (requested_by_guardian_id) REFERENCES public.guardians(id);


--
-- Name: tutoring_requests tutoring_requests_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: tutoring_requests tutoring_requests_subject_id_subjects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutoring_requests
    ADD CONSTRAINT tutoring_requests_subject_id_subjects_id_fk FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: change_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: consent_evidence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consent_evidence ENABLE ROW LEVEL SECURITY;

--
-- Name: course_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: course_offerings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: guardians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

--
-- Name: households; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_inbox; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integration_inbox ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_outbox; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integration_outbox ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

--
-- Name: policy_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: price_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: tutoring_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutoring_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: tutors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict dmn8a7MIJvNT1hXPL99b99X99D233gmVefvxH5BoO0EXdq4sqz7OmCBcszhqQlF

