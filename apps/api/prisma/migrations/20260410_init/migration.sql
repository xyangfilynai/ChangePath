-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "plan_tier" VARCHAR(50) NOT NULL DEFAULT 'starter',
    "sso_config_json" JSONB,
    "data_retention_policy_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255),
    "department" VARCHAR(255),
    "role_type" VARCHAR(20) NOT NULL DEFAULT 'member',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "device_family" VARCHAR(255),
    "device_class" VARCHAR(5) NOT NULL,
    "regulatory_pathway_baseline" VARCHAR(20) NOT NULL,
    "predicate_device" VARCHAR(255),
    "pccp_status" VARCHAR(20) NOT NULL DEFAULT 'none',
    "software_level_of_concern" VARCHAR(20) NOT NULL,
    "jurisdictions_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_cases" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "case_number" VARCHAR(50) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "change_summary" TEXT,
    "change_type" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "created_by_user_id" UUID NOT NULL,
    "case_owner_user_id" UUID NOT NULL,
    "due_date" TIMESTAMP(3),
    "current_decision" VARCHAR(255),
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "engine_version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_assignments" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "section_id" VARCHAR(50) NOT NULL,
    "assigned_to_user_id" UUID,
    "locked_at" TIMESTAMP(3),
    "lock_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_response_sets" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "schema_version" VARCHAR(50) NOT NULL,
    "answers_json" JSONB NOT NULL,
    "derived_state_json" JSONB,
    "engine_output_json" JSONB,
    "completeness_status_json" JSONB,
    "updated_by_user_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_response_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "case_id" UUID,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "performed_by_user_id" UUID NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "ip_address" VARCHAR(45),

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_version_registry" (
    "engine_version" VARCHAR(50) NOT NULL,
    "schema_version" VARCHAR(50) NOT NULL,
    "released_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changelog" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "engine_version_registry_pkey" PRIMARY KEY ("engine_version")
);

-- CreateTable
CREATE TABLE "organization_feature_flags" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "flag_key" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_email_key" ON "users"("organization_id", "email");

-- CreateIndex
CREATE INDEX "change_cases_organization_id_status_idx" ON "change_cases"("organization_id", "status");

-- CreateIndex
CREATE INDEX "change_cases_organization_id_product_id_idx" ON "change_cases"("organization_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "change_cases_organization_id_case_number_key" ON "change_cases"("organization_id", "case_number");

-- CreateIndex
CREATE INDEX "section_assignments_assigned_to_user_id_idx" ON "section_assignments"("assigned_to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_assignments_case_id_section_id_key" ON "section_assignments"("case_id", "section_id");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_case_id_idx" ON "audit_events"("organization_id", "case_id");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_feature_flags_organization_id_flag_key_key" ON "organization_feature_flags"("organization_id", "flag_key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_cases" ADD CONSTRAINT "change_cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_cases" ADD CONSTRAINT "change_cases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_cases" ADD CONSTRAINT "change_cases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_cases" ADD CONSTRAINT "change_cases_case_owner_user_id_fkey" FOREIGN KEY ("case_owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_assignments" ADD CONSTRAINT "section_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "change_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_response_sets" ADD CONSTRAINT "assessment_response_sets_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "change_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_response_sets" ADD CONSTRAINT "assessment_response_sets_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "change_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_feature_flags" ADD CONSTRAINT "organization_feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
