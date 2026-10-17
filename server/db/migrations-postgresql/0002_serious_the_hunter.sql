CREATE TABLE "erp_sessions" (
	"identity" text PRIMARY KEY NOT NULL,
	"tokens_ciphertext" text NOT NULL,
	"version" integer NOT NULL,
	"expires_at" timestamp with time zone,
	"renewed_at" timestamp with time zone NOT NULL
);
