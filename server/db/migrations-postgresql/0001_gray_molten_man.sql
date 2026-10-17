CREATE TABLE "erp_snapshots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_sync" (
	"source" text PRIMARY KEY NOT NULL,
	"id" varchar(36),
	"state" text NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error" text,
	"snapshot_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "purchase_drafts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "purchase_drafts_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "replenishment_policies" (
	"key" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp_sync" ADD CONSTRAINT "erp_sync_snapshot_id_erp_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."erp_snapshots"("id") ON DELETE no action ON UPDATE no action;