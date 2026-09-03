-- New tables backing the admin Notifications, CMS/Banners, Services, and
-- Settings pages, which previously had no backend at all.

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "sent_by" TEXT,
    "recipients_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badge" TEXT,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_inquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "service_type" TEXT NOT NULL,
    "property_reference" TEXT,
    "estimated_budget" TEXT,
    "assigned_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "service_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "values" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
