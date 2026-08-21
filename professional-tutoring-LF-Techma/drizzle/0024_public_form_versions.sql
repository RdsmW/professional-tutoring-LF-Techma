DO $$ BEGIN
  CREATE TYPE "public_form_status" AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public_form_version_status" AS ENUM ('draft', 'published', 'retired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public_form_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "form_key" text NOT NULL UNIQUE,
  "public_path" text,
  "status" "public_form_status" DEFAULT 'inactive' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_form_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "definition_id" uuid NOT NULL REFERENCES "public_form_definitions"("id") ON DELETE CASCADE,
  "version_number" integer NOT NULL,
  "status" "public_form_version_status" DEFAULT 'draft' NOT NULL,
  "content" jsonb NOT NULL,
  "change_reason" text,
  "created_by_staff_id" uuid REFERENCES "staff_profiles"("id"),
  "published_at" timestamp with time zone,
  "retired_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "public_form_versions_definition_version_unique" UNIQUE("definition_id", "version_number")
);

CREATE TABLE IF NOT EXISTS "public_form_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "definition_id" uuid NOT NULL REFERENCES "public_form_definitions"("id") ON DELETE CASCADE,
  "version_id" uuid REFERENCES "public_form_versions"("id"),
  "action" text NOT NULL,
  "reason" text,
  "staff_id" uuid REFERENCES "staff_profiles"("id"),
  "staff_name" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "tutoring_requests"
  ADD COLUMN IF NOT EXISTS "form_version_id" uuid REFERENCES "public_form_versions"("id");