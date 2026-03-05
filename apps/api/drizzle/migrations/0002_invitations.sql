CREATE TABLE "invitations" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token"         varchar(64) UNIQUE NOT NULL,
  "email"         varchar(255) NOT NULL,
  "name"          varchar(255) NOT NULL,
  "plan"          "plan" NOT NULL DEFAULT 'free',
  "used"          boolean NOT NULL DEFAULT false,
  "expires_at"    timestamp NOT NULL,
  "created_by_id" uuid,
  "created_at"    timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
