CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"stage" text DEFAULT 'entrada' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"utm_source" text DEFAULT 'Google Ads',
	"utm_campaign" text DEFAULT 'Campanha Manual',
	"rooms" text DEFAULT '[]',
	"promob_files" text DEFAULT '[]',
	"payment_method" text DEFAULT '',
	"installments" integer DEFAULT 1,
	"down_payment" integer DEFAULT 0,
	"delivery_date" text DEFAULT '',
	"assembler" text DEFAULT '',
	"checklist" text DEFAULT '{}',
	"chat_history" text DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
