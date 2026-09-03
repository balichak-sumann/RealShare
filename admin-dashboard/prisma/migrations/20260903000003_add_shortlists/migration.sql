CREATE TABLE "shortlists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shortlists_user_id_property_id_key" ON "shortlists"("user_id", "property_id");
